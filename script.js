class HeatConductionSimulator {
    constructor(nx, r) {
        this.nx = nx;
        this.r = r;
        this.temperature = new Array(this.nx).fill(0);
        this.nextTemperature = new Array(this.nx).fill(0);
        this.heatSourceIndex = -1;
    }

    setHeatSource(index) {
        this.heatSourceIndex = index;
    }

    initialize() {
        this.temperature.fill(0);
        if (this.heatSourceIndex >= 0) {
            this.temperature[this.heatSourceIndex] = 1.0;
        }
    }

    step() {
        this.nextTemperature[0] = this.temperature[0] + 2 * this.r * (this.temperature[1] - this.temperature[0]);

        for (let i = 1; i < this.nx - 1; i++) {
            this.nextTemperature[i] = this.temperature[i] + this.r * (this.temperature[i + 1] - 2 * this.temperature[i] + this.temperature[i - 1]);
        }

        this.nextTemperature[this.nx - 1] = this.temperature[this.nx - 1] + 2 * this.r * (this.temperature[this.nx - 2] - this.temperature[this.nx - 1]);

        if (this.heatSourceIndex >= 0) {
            this.nextTemperature[this.heatSourceIndex] = 1.0;
        }

        for (let i = 0; i < this.nx; i++) {
            this.temperature[i] = this.nextTemperature[i];
        }
    }
}

class CanvasController {
    constructor() {
        this.canvas = document.querySelector("#heatmapCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.heatSourceSlider = document.querySelector("#heatSourceSlider");
        this.sliderValue = document.querySelector("#sliderValue");
        this.playButton = document.querySelector("#playButton");
        this.stopButton = document.querySelector("#stopButton");
        this.resetButton = document.querySelector("#resetButton");
        this.progressSlider = document.querySelector("#animationProgress");
        this.progressValue = document.querySelector("#progressValue");
    }

    draw(temperatureArray) {
        const nx = temperatureArray.length;
        const barWidth = this.canvas.width / nx;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < nx; i++) {
            const temperature = temperatureArray[i];
            const hue = 240 * (1 - temperature);
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.ctx.fillRect(i * barWidth, 0, barWidth, this.canvas.height);
        }
    }

    updateProgress(percent) {
        this.progressSlider.value = percent;
        this.progressValue.textContent = `${Math.floor(percent)}%`;
    }
}

class App {
    constructor() {
        this.NX = 200;
        this.R = 0.5;
        this.simulator = new HeatConductionSimulator(this.NX, this.R);
        this.ui = new CanvasController();
        this.isPlaying = false;
        this.animationFrameId = null;
        this.setupEventListeners();
        this.reset();
    }

    setupEventListeners() {
        this.ui.playButton.addEventListener("click", () => this.start());
        this.ui.stopButton.addEventListener("click", () => this.stop());
        this.ui.resetButton.addEventListener("click", () => this.reset());
        this.ui.heatSourceSlider.addEventListener("input", () => this.reset());
        this.ui.progressSlider.addEventListener("input", () => this.seekToProgress());
    }

    start() {
        if (this.isPlaying) {
            return;
        }
        this.isPlaying = true;
        this.loop();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    reset() {
        this.stop();
        const sliderValue = parseFloat(this.ui.heatSourceSlider.value);
        const heatSourceIndex = Math.floor(sliderValue * (this.NX - 1));
        this.simulator.setHeatSource(heatSourceIndex);
        this.simulator.initialize();
        this.ui.draw(this.simulator.temperature);
        this.ui.sliderValue.textContent = sliderValue.toFixed(2);
        this.ui.updateProgress(0);
    }

    seekToProgress() {
        this.stop();
        const targetPercent = parseFloat(this.ui.progressSlider.value);
        const sliderValue = parseFloat(this.ui.heatSourceSlider.value);
        const heatSourceIndex = Math.floor(sliderValue * (this.NX - 1));
        this.simulator.setHeatSource(heatSourceIndex);
        this.simulator.initialize();

        const maxSteps = 50000;
        for (let i = 0; i < maxSteps; i++) {
            this.simulator.step();
            const averageTemp = this.simulator.temperature.reduce((sum, temp) => sum + temp, 0) / this.NX;
            const currentPercent = averageTemp * 100;
            if (currentPercent >= targetPercent) {
                break;
            }
        }
        this.ui.draw(this.simulator.temperature);
        this.ui.updateProgress(targetPercent);
    }

    loop() {
        if (!this.isPlaying) {
            return;
        }

        for (let i = 0; i < 5; i++) {
            this.simulator.step();
        }
        this.ui.draw(this.simulator.temperature);

        const averageTemp = this.simulator.temperature.reduce((sum, temp) => sum + temp, 0) / this.NX;
        this.ui.updateProgress(averageTemp * 100);

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

new App();