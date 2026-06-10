// PARALLAX

const parallax = document.querySelector(".parallax");

window.addEventListener("scroll", () => {

    let desplazamiento = window.pageYOffset;

    parallax.style.backgroundPositionY =
        desplazamiento * 0. + "px";

});


// GALERÍA 

const imagenes = document.querySelectorAll(".grid img");
const lightbox = document.getElementById("lightbox");

const imagenAmpliada =
    document.getElementById("imagen-ampliada");

const cerrar =
    document.querySelector(".cerrar");


imagenes.forEach(imagen => {

    imagen.addEventListener("click", () => {

        lightbox.style.display = "flex";
        imagenAmpliada.src = imagen.src;

    });

});


cerrar.addEventListener("click", () => {

    lightbox.style.display = "none";

});


lightbox.addEventListener("click", (e) => {

    if(e.target === lightbox){

        lightbox.style.display = "none";

    }

});
window.addEventListener("scroll", () => {
    const scroll = window.pageYOffset;

    document.querySelectorAll(".orb").forEach((orb, i) => {
        orb.style.transform =
            `translateY(${scroll * (0.05 + i*0.02)}px)`;
    });
});

