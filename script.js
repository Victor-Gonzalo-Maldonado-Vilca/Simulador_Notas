const formulario = document.getElementById('formulario_notas'); 
formulario.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const nota1 = parseFloat(document.getElementById('nota1').value) || 0;
    const peso1 = parseFloat(document.getElementById('peso1').value) || 0;

    const nota2 = parseFloat(document.getElementById('nota2').value) || 0;
    const peso2 = parseFloat(document.getElementById('peso2').value) || 0;

    const nota3 = parseFloat(document.getElementById('nota3').value) || 0;
    const peso3 = parseFloat(document.getElementById('peso3').value) || 0;

    const nota4 = parseFloat(document.getElementById('nota4').value) || 0;
    const peso4 = parseFloat(document.getElementById('peso4').value) || 0;

    const nota5 = parseFloat(document.getElementById('nota5').value) || 0;
    const peso5 = parseFloat(document.getElementById('peso5').value) || 0;

    const nota6 = parseFloat(document.getElementById('nota6').value) || 0;
    const peso6 = parseFloat(document.getElementById('peso6').value) || 0;


    const sumaNotas = nota1 + nota2 + nota3 + nota4 + nota5 + nota6; 
    if (sumaNotas == 0){
        alert("Las notas no pueden ser todas cero. Por favor, ingrese al menos una nota válida.");
        return;
    }
    const promedio = (nota1 * peso1 + nota2 * peso2 + nota3 * peso3 + nota4 * peso4 + nota5 * peso5 + nota6 * peso6) / (parseInt(peso1) + parseInt(peso2) + parseInt(peso3) + parseInt(peso4) + parseInt(peso5) + parseInt(peso6));
    document.getElementById('resultado').textContent = promedio.toFixed(2);
});