document.addEventListener('DOMContentLoaded', () => {

  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach( el => {
      el.addEventListener('click', () => {

        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);

        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }

  // Get all tab elements
  const tabs = document.querySelectorAll('.tabs li');
  const tabContentBoxes = document.querySelectorAll('#tab-content > div');

  // Add a click event on each of them
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {

      event.preventDefault();

      // Skip if "clicked" tab is already active
      if ($('.tabs li.is-active').attr('id') === tab.id) {
        return;
      }

      tabs.forEach(item => item.classList.remove('is-active'));

      tab.classList.add('is-active');

      // Get the target from the "data-target" attribute
      const target = tab.dataset.target;

      // console.log(target);
      tabContentBoxes.forEach(box => {
        if (box.getAttribute('id') === target) {
          box.classList.remove('is-hidden');
        } else {
          box.classList.add('is-hidden');
        }
      });

      // Update URL's fragment to match the tab id
      // See https://lea.verou.me/2011/05/change-url-hash-without-page-jump/
      if(window.history.pushState) {
        window.history.pushState(null, null, '#' + tab.id);
      } else {
        window.location.hash = '#' + tab.id;
      }
      document.querySelector('div.tabs').scrollIntoView({behavior: 'smooth'});
    })
  });

  // Older stable release picker (on the download page)
  const releaseVersionSelect = document.getElementById('older-release-version');
  if (releaseVersionSelect) {
    const releaseOsSelect = document.getElementById('older-release-os');
    const releaseDownloadButton = document.getElementById('older-release-download');

    // Pre-select the operating system based on the visitor's platform
    const platform = (navigator.userAgent + ' ' + (navigator.platform || '')).toLowerCase();
    if (platform.indexOf('win') !== -1) {
      releaseOsSelect.value = 'win';
    } else if (platform.indexOf('mac') !== -1) {
      releaseOsSelect.value = 'macosx';
    } else {
      releaseOsSelect.value = 'linux';
    }

    // Compare two version strings (e.g. "5.12.0", "4.11.20210226") numerically, descending
    const compareVersionsDesc = (a, b) => {
      const pa = a.split(/[.-]/).map(Number);
      const pb = b.split(/[.-]/).map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na !== nb) {
          return nb - na;
        }
      }
      return 0;
    };

    // Populate the version combobox from the Slicer packages API.
    // Deferred until the "Access Older Releases" tab is first opened, so the
    // request is not made on every visit to the download page.
    let versionsRequested = false;
    const populateReleaseVersions = () => {
      if (versionsRequested) {
        return;
      }
      versionsRequested = true;
      // Declare the target as a public address so Chrome does not show the
      // "Access other devices on your local network" (Local Network Access)
      // permission prompt for this cross-origin request.
      fetch('https://slicer-packages.kitware.com/api/v1/app/5f4474d0e1d8c75dfc705482/release', { targetAddressSpace: 'public' })
        .then(response => response.json())
        .then(releases => {
          const versions = releases
            .map(release => release.name)
            .filter(name => name)
            .sort(compareVersionsDesc)
            // Drop the latest stable release; it is already offered in the table above
            .slice(1);
          releaseVersionSelect.innerHTML = '';
          versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = 'Slicer ' + version;
            releaseVersionSelect.appendChild(option);
          });
        })
        .catch(() => {
          // Allow a later tab visit to retry the request
          versionsRequested = false;
          releaseVersionSelect.innerHTML = '<option value="">Could not load versions</option>';
        });
    };

    // Fetch the versions the first time the older-releases tab is opened.
    // Clicking the tab fires this listener, including when the page auto-selects
    // the tab from the URL fragment (#access-older-releases) further below.
    const olderReleasesTab = document.getElementById('access-older-releases');
    if (olderReleasesTab) {
      olderReleasesTab.addEventListener('click', populateReleaseVersions);
    }

    // Navigate to the direct download URL for the selected version and OS
    releaseDownloadButton.addEventListener('click', (event) => {
      event.preventDefault();
      const version = releaseVersionSelect.value;
      const os = releaseOsSelect.value;
      if (!version) {
        return;
      }
      window.location.href = 'https://download.slicer.org/download?version=' +
        encodeURIComponent(version) + '&os=' + encodeURIComponent(os) + '&stability=release';
    });
  }

  // Select tab with an ID matching the current URL's fragment
  $('div.tabs li:target').click();

  // Add event listener to select the expected tab when URL's fragment is externally updated
  window.addEventListener('hashchange', (event) => {
    $('div.tabs li:target').click();
    },
    /* useCapture */ false
  );

});