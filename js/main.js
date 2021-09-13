const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const slider = document.getElementById('slider');
const currentCap = document.getElementById('slidevalue');
const silentImage = document.getElementById('silent');
const talkingImage = document.getElementById('talking');
let volumeCallback = null;
let volumeInterval = null;
let volumeCap = slider.value;

const app = {
  init: async() => {

    app.setCurrentCap();

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true}});
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -127;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.4;
      audioSource.connect(analyser);
      const volumes = new Uint8Array(analyser.frequencyBinCount);

      volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;

        for(const volume of volumes) {
          volumeSum += volume;
        }

        const averageVolume = volumeSum / volumes.length;
        if(averageVolume > volumeCap) {
          console.log(averageVolume * 100 / 127);
          app.isTalking(true);
        } else {
          app.isTalking(false);
        }

      };
    } catch(e) {
      console.error('Failed to initialize volume visualizer...', e);
    }
  },
  toggleInputs: () => {
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
  },
  isTalking: bool => {
    if(bool) {
      silentImage.classList.add('hidden');
      talkingImage.classList.remove('hidden');
    } else {
      silentImage.classList.remove('hidden');
      talkingImage.classList.add('hidden');
    }
  },
  setCurrentCap: () => {
    currentCap.innerText = volumeCap;
  }
}

window.addEventListener('load', app.init);

startButton.addEventListener('click', () => {
  // Updating every 100ms (should be same as CSS transition speed)
  if(volumeCallback !== null && volumeInterval === null) {
    app.toggleInputs();
    volumeInterval = setInterval(volumeCallback, 100);
    slider.disabled = true;
  }
});

stopButton.addEventListener('click', () => {
  if(volumeInterval !== null) {
    app.toggleInputs();
    clearInterval(volumeInterval);
    volumeInterval = null;
    slider.disabled = false;
    app.isTalking(false);
  }
});

slider.addEventListener('input', () => {
  volumeCap = slider.value
  app.setCurrentCap();
});

