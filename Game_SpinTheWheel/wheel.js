const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

const rotationValues = [
  { minDegree: 0, maxDegree: 30, value: "Sinigang" },
  { minDegree: 31, maxDegree: 90, value: "Adobo" },
  { minDegree: 91, maxDegree: 150, value: "Sisig" },
  { minDegree: 151, maxDegree: 210, value: "Bicol Express" },
  { minDegree: 211, maxDegree: 270, value: "Nilaga" },
  { minDegree: 271, maxDegree: 330, value: "Fried Chicken" },
  { minDegree: 331, maxDegree: 360, value: "Sinigang" },
];

const data = [16, 16, 16, 16, 16, 16];

var pieColors = [
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
];
let myChart = new Chart(wheel, {
  plugins: [ChartDataLabels],
  type: "pie",
  data: {
    labels: [
      "Adobo",
      "Sinigang",
      "Fried Chicken",
      "Nilaga",
      "Bicol Express",
      "Sisig",
    ],
    datasets: [{ backgroundColor: pieColors, data: data, borderColor: "#000" }],
  },
  options: {
    responsive: true,
    animation: { duration: 0 },
    plugins: {
      tooltip: false,
      legend: { display: false },
      datalabels: {
        color: "#fff",
        formatter: (_, context) => context.chart.data.labels[context.dataIndex],
        font: (context) => {
          const label = context.chart.data.labels[context.dataIndex];
          if (label.length > 10) {
            return { size: 14 }; // smaller font for long labels
          }
          return { size: 20 }; // default size
        },
      },
    },
  },
});

const valueGenerator = (angleValue) => {
  for (let i of rotationValues) {
    if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
      finalValue.innerHTML = `<p>Value: ${i.value}</p>`;
      spinBtn.disabled = false;
      break;
    }
  }
};

let count = 0;
let resultValue = 101;
spinBtn.addEventListener("click", () => {
  spinBtn.disabled = true;
  finalValue.innerHTML = `<p>Enjoy!</p>`;
  let randomDegree = Math.floor(Math.random() * 355 - 0 + 1);
  let rotationInterval = window.setInterval(() => {
    myChart.options.rotation = myChart.options.rotation + resultValue;
    myChart.update();
    if (myChart.options.rotation >= 360) {
      count += 1;
      resultValue -= 5;
      myChart.options.rotation = 0;
    } else if (count > 15 && myChart.options.rotation == randomDegree) {
      valueGenerator(randomDegree);
      clearInterval(rotationInterval);
      count = 0;
      resultValue = 101;
    }
  }, 10);
});

document.getElementById("home").addEventListener("click", function () {
  window.location.href = "/index.html"; // Updated to absolute path
});
