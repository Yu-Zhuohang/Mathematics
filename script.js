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
            img.src = `SVG/${String(i).padStart(4, '0')}.svg`;
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

    function downloadPDF() {
    const localPath = 'PDF/高等数学手写讲义（数学一）.pdf';
    const githubUrl = 'https://github.com/Yu-Zhuohang/Mathematics/raw/refs/heads/main/PDF/%E9%AB%98%E7%AD%89%E6%95%B0%E5%AD%A6%E6%89%8B%E5%86%99%E8%AE%B2%E4%B9%89%EF%BC%88%E6%95%B0%E5%AD%A6%E4%B8%80%EF%BC%89.pdf?download=';
    const fileName = '高等数学手写讲义（数学一）.pdf';

    const downloadBtn = document.querySelector('[onclick="downloadPDF()"]');
    if (downloadBtn.classList.contains('downloading')) {
        return;
    }
    downloadBtn.classList.add('downloading');

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    const messageBox = document.createElement('div');
    messageBox.style.backgroundColor = '#fff';
    messageBox.style.padding = '25px';
    messageBox.style.borderRadius = '10px';
    messageBox.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    messageBox.style.textAlign = 'center';
    messageBox.style.maxWidth = '320px';

    const title = document.createElement('h3');
    title.textContent = '准备下载';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#333';
    title.style.fontSize = '18px';

    const messageText = document.createElement('p');
    messageText.textContent = '正在请求下载链接，请稍候...';
    messageText.style.margin = '0 0 20px 0';
    messageText.style.color = '#666';
    messageText.style.fontSize = '14px';

    const progressBar = document.createElement('div');
    progressBar.style.width = '100%';
    progressBar.style.height = '6px';
    progressBar.style.backgroundColor = '#f0f0f0';
    progressBar.style.borderRadius = '3px';
    progressBar.style.overflow = 'hidden';
    progressBar.style.marginBottom = '15px';

    const progressFill = document.createElement('div');
    progressFill.style.width = '0%';
    progressFill.style.height = '100%';
    progressFill.style.backgroundColor = '#4CAF50';
    progressFill.style.transition = 'width 0.3s ease';
    progressBar.appendChild(progressFill);

    messageBox.appendChild(title);
    messageBox.appendChild(messageText);
    messageBox.appendChild(progressBar);
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        progressFill.style.width = `${Math.min(progress, 90)}%`;
        if (progress >= 90) clearInterval(progressInterval);
    }, 200);

    fetch(localPath, { method: 'HEAD' })
        .then(response => {
            const downloadUrl = response.ok ? localPath : githubUrl;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(() => {
            const link = document.createElement('a');
            link.href = githubUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .finally(() => {
            progressFill.style.width = '100%';
            title.textContent = '开始下载';
            messageText.textContent = '文件已开始下载，请稍候...';
            
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 500);
            }, 2000);

            downloadBtn.classList.remove('downloading');
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
    window.downloadPDF = downloadPDF;
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