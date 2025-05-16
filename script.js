document.addEventListener('DOMContentLoaded', function () {
    let scrollTimeout;
    let currentPage = 1;
    let currentZoom = 1;
    let isDoublePage = false;
    let thumbnailClickHandler = null;
    const pages = document.querySelectorAll('.page');
    const thumbnailSidebar = document.getElementById('thumbnailSidebar');
    const pagesContainer = document.getElementById('pagesContainer');
    const zoomLevelDisplay = document.getElementById('zoomLevel');
    const totalPages = document.querySelectorAll('.page').length;

    function loadSettings() {
        const savedZoom = localStorage.getItem('zoomLevel');
        if (savedZoom) {
            currentZoom = parseFloat(savedZoom);
            currentZoom = Math.max(0.5, Math.min(2, currentZoom));
        }

        const savedPageMode = localStorage.getItem('pageMode');
        if (savedPageMode) {
            isDoublePage = savedPageMode === 'double';
            document.body.classList.toggle('double-page', isDoublePage);
        }
    }

    function toggleThumbnails() {
        const wasActive = thumbnailSidebar.classList.contains('active');
        thumbnailSidebar.classList.toggle('active');

        if (thumbnailClickHandler) {
            document.removeEventListener('click', thumbnailClickHandler);
        }

        if (!wasActive) {
            thumbnailClickHandler = function (event) {
                const sidebar = document.getElementById('thumbnailSidebar');
                const toggleBtn = document.querySelector('[onclick="toggleThumbnails()"]');

                if (!sidebar.contains(event.target) &&
                    !toggleBtn.contains(event.target) &&
                    sidebar.classList.contains('active')) {
                    toggleThumbnails();
                }
            };

            document.addEventListener('click', thumbnailClickHandler, { capture: true });
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    function togglePageMode() {
        const container = document.getElementById('container');
        container.style.scrollBehavior = 'auto';

        const scrollPosBefore = container.scrollTop;
        const firstVisiblePage = getCurrentVisiblePage(scrollPosBefore);

        isDoublePage = !isDoublePage;
        document.body.classList.toggle('double-page', isDoublePage);
        localStorage.setItem('pageMode', isDoublePage ? 'double' : 'single');

        void container.offsetHeight;

        let targetScrollPos;
        if (isDoublePage) {
            const leftPage = firstVisiblePage % 2 === 0 ? firstVisiblePage - 1 : firstVisiblePage;
            const leftPageElement = document.querySelector(`.page:nth-child(${leftPage})`);
            if (leftPageElement) {
                targetScrollPos = leftPageElement.offsetTop - container.offsetTop;
            }
        } else {
            const pageElement = document.querySelector(`.page:nth-child(${firstVisiblePage})`);
            if (pageElement) {
                targetScrollPos = pageElement.offsetTop - container.offsetTop;
            }
        }

        if (targetScrollPos !== undefined) {
            container.scrollTop = targetScrollPos;
        }

        setTimeout(() => {
            container.style.scrollBehavior = 'smooth';
        }, 0);

        currentPage = firstVisiblePage;
        updateUI();

        zoomTo(currentZoom);
    }

    function getCurrentVisiblePage(scrollPos) {
        const container = document.getElementById('container');
        let closestPage = 1;
        let minDistance = Infinity;

        document.querySelectorAll('.page').forEach((page, index) => {
            const pageTop = page.offsetTop - container.offsetTop;
            const distance = Math.abs(scrollPos - pageTop);
            if (distance < minDistance) {
                minDistance = distance;
                closestPage = index + 1;
            }
        });

        return closestPage;
    }

    document.getElementById('totalPages').textContent = totalPages;

    function zoomTo(zoomLevel) {
        const currentPageElement = document.querySelector(`.page:nth-child(${currentPage})`);
        if (!currentPageElement) return;

        const container = document.getElementById('container');
        const pageTopBefore = currentPageElement.offsetTop - container.offsetTop;
        const containerHeight = container.clientHeight;
        const scrollPosBefore = container.scrollTop;

        const pageVisiblePosition = pageTopBefore - scrollPosBefore;

        zoomLevel = Math.max(0.5, Math.min(2, zoomLevel));
        currentZoom = zoomLevel;
        localStorage.setItem('zoomLevel', currentZoom.toString());
        pagesContainer.style.transform = `scale(${currentZoom})`;
        const baseWidth = isDoublePage ? 1200 : 600;
        pagesContainer.style.width = `${baseWidth * currentZoom}px`;
        pagesContainer.style.margin = '0 auto';

        void pagesContainer.offsetHeight;

        const pageTopAfter = currentPageElement.offsetTop - container.offsetTop;
        const targetScrollPos = pageTopAfter - pageVisiblePosition;

        const maxScroll = pagesContainer.scrollHeight - containerHeight;
        container.scrollTop = Math.max(0, Math.min(maxScroll, targetScrollPos));

    }

    function zoomIn() {
        zoomTo(currentZoom * 1.1);
    }

    function zoomOut() {
        zoomTo(currentZoom * 0.9);
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '+' || e.key === '=') {
                zoomIn();
                e.preventDefault();
            } else if (e.key === '-' || e.key === '_') {
                zoomOut();
                e.preventDefault();
            } else if (e.key === '0') {
                zoomTo(1);
                e.preventDefault();
            }
        }
    });

    document.getElementById('container').addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            zoomTo(currentZoom * factor);
        }
    }, { passive: false });

    function generateThumbnails() {
        thumbnailSidebar.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const container = document.createElement('div');
            container.className = 'thumbnail-container';
            const img = document.createElement('img');
            img.src = `Mathematics/SVG/${String(i).padStart(4, '0')}.svg`;
            img.className = 'thumbnail';
            img.dataset.page = i;
            img.onclick = () => goToPage(i);
            const pageNumber = document.createElement('div');
            pageNumber.className = 'thumbnail-page-number';
            pageNumber.textContent = `第 ${i} 页`;
            container.appendChild(img);
            container.appendChild(pageNumber);
            thumbnailSidebar.appendChild(container);
        }
    }

    function goToPage(page) {
        currentPage = Math.max(1, Math.min(totalPages, page));
        document.getElementById('pageInput').value = currentPage;

        const container = document.getElementById('container');
        const pageElement = document.querySelector(`.page:nth-child(${currentPage})`);

        if (pageElement) {
            let targetPage = currentPage;
            if (isDoublePage && currentPage % 2 === 0) {
                targetPage = currentPage - 1;
            }

            const targetElement = document.querySelector(`.page:nth-child(${targetPage})`);
            if (targetElement) {
                container.scrollTo({
                    top: targetElement.offsetTop - container.offsetTop,
                    behavior: 'smooth'
                });
            }
        }
        updateUI();
    }

    function previousPage() {
        if (isDoublePage && currentPage > 2) {
            goToPage(currentPage - 2);
        } else {
            goToPage(currentPage - 1);
        }
    }

    function nextPage() {
        if (isDoublePage && currentPage < totalPages - 1) {
            goToPage(currentPage + 2);
        } else {
            goToPage(currentPage + 1);
        }
    }

    document.getElementById('container').addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const container = document.getElementById('container');
            const scrollPos = container.scrollTop;
            const containerHeight = container.clientHeight;

            let closestPage = 1;
            let minDistance = Infinity;

            pages.forEach((page, index) => {
                const pageTop = page.offsetTop - container.offsetTop;
                const distance = Math.abs(scrollPos - pageTop);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPage = index + 1;
                }
            });

            if (isDoublePage) {
                if (closestPage % 2 === 0 && closestPage <= totalPages) {
                    currentPage = closestPage;
                } else {
                    currentPage = closestPage % 2 === 0 ? closestPage - 1 : closestPage;
                }
            } else {
                currentPage = closestPage;
            }

            updateUI();
        }, 100);
    });

    document.getElementById('pageInput').addEventListener('change', () => {
        const inputPage = parseInt(document.getElementById('pageInput').value);
        goToPage(inputPage);
    });

    function updateUI() {
        document.getElementById('pageInput').value = currentPage;
        const thumbnails = document.querySelectorAll('.thumbnail');
        const thumbnailContainers = document.querySelectorAll('.thumbnail-container');

        thumbnails.forEach(thumb => {
            const page = parseInt(thumb.dataset.page);
            if (isDoublePage) {
                const leftPage = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
                const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : null;
                thumb.classList.toggle('active', page === leftPage || page === rightPage);
            } else {
                thumb.classList.toggle('active', page === currentPage);
            }
        });
    }

    loadSettings();
    zoomTo(currentZoom);
    generateThumbnails();
    goToPage(1);

    window.toggleThumbnails = toggleThumbnails;
    window.togglePageMode = togglePageMode;
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    window.previousPage = previousPage;
    window.nextPage = nextPage;
    window.toggleFullscreen = toggleFullscreen;
});

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

document.addEventListener('selectstart', function (e) {
    e.preventDefault();
});

document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});