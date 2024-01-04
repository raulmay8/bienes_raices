import Swal from 'sweetalert2';
 
(function() {
 
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })
 
    if(!document.querySelector('.propiedad')) return;
 
    const propiedades = document.querySelectorAll('.propiedad');
    propiedades.forEach(propiedad => {
        propiedad.addEventListener('click', e => {
            if(e.target.classList.contains('btn-eliminar')) {
                e.preventDefault();
                Swal.fire({
                    title: '¿Quieres eliminar esta propiedad?',
                    text: "¡No podrás revertir esto!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, Eliminar!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        Toast.fire({
                            icon: 'success',
                            title: 'Propiedad eliminada exitosamente.'
                        }).then(() => {
                            e.target.parentElement.submit();
                        })
                    }
                })
            }
        })
    })   
})();