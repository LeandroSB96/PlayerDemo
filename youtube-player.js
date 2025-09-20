// Manejo de los videos de YouTube
document.querySelectorAll('.video-card').forEach(card => {
    const btn = card.querySelector('.yt-play-btn');
    btn.addEventListener('click', function() {
        const ytid = card.getAttribute('data-ytid');
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '200';
        iframe.src = `https://www.youtube.com/embed/${ytid}?autoplay=1`;
        iframe.title = 'YouTube video player';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        card.querySelector('.yt-thumb-container').replaceWith(iframe);
    });
});