let n = 0;
document.getElementById("btn").addEventListener("click", () => {
  document.getElementById("out").textContent = `Kliknięć: ${++n}`;
});
