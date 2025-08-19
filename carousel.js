const carousel = document.querySelector('.carousel');
const carouselItems = document.querySelectorAll('.carousel-item');
const sliderButtons = document.querySelectorAll('.slider-button');
let currentIndex = 0;
let autoSlideInterval;

// Función para mostrar un banner específico
function showSlide(index) {
    if (index >= carouselItems.length) index = 0;
    if (index < 0) index = carouselItems.length - 1;

    carousel.style.transform = `translateX(-${index * 100}%)`;

    carouselItems.forEach((item, i) => {
        item.classList.remove('active');
        const video = item.querySelector('video');
        if (video) {
            if (i === index) {
                video.play().catch(error => {
                    console.error('Error al reproducir el video:', error);
                });
            } else {
                video.pause();
                video.currentTime = 0;
            }
        }
    });
    sliderButtons.forEach(button => button.classList.remove('active'));
    carouselItems[index].classList.add('active');
    sliderButtons[index].classList.add('active');

    currentIndex = index;
}

// Función para iniciar el movimiento automático
function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        currentIndex++;
        showSlide(currentIndex);
    }, 7000);
}

// Función para detener el movimiento automático
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Inicia el slider automáticamente al cargar la página
showSlide(currentIndex);
startAutoSlide();

// Agregar eventos a los botones de navegación
sliderButtons.forEach((button, index) => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        stopAutoSlide();
        showSlide(index);
        setTimeout(startAutoSlide, 9000);
    });
});
