// Código para el sidebar lateral
document.addEventListener('DOMContentLoaded', function() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');

});

document.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });
});