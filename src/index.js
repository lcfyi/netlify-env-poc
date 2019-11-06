window.onload = () => {
    // I made a change
    document.getElementById("context").innerHTML = process.env.CONTEXT;
    document.getElementById("secret").innerHTML = process.env.SECRET;
}