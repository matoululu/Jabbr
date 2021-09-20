const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const slider = document.getElementById('slider');
const currentCap = document.getElementById('slidevalue');
const silentImage = document.getElementById('silent');
const talkingImage = document.getElementById('talking');
const holdingImage = document.getElementById('holding');
const avgVolumeAllowance = 3;
let volumeCallback = null;
let volumeInterval = null;
let volumeCap = slider.value;


const voiceHandler = {
  detectVolume: (volume, range) => {

    // Determine if we're talking
    if (volume > volumeCap) {
      const avgRange = Math.floor(voiceHandler.getAverage(range));
      animate.setState('talking')

      // Determine if we're holding a note
      if(volume >= (avgRange - avgVolumeAllowance) && volume <= (avgRange + avgVolumeAllowance)) {
        animate.setState('holding');
      }
    } else {
      animate.setState('silent');
    }
  },
  getAverage: array => {
    const average = array.reduce((a, b) => a + b) / array.length;
    return average;
  }
}

const animate = {
  setState: state => {
    switch (state) {
      case 'silent':
        silentImage.classList.remove('hidden');
        talkingImage.classList.add('hidden');
        holdingImage.classList.add('hidden');
        break;
      case 'talking':
        talkingImage.classList.remove('hidden');
        holdingImage.classList.add('hidden');
        silentImage.classList.add('hidden');
        break;
      case 'holding':
        holdingImage.classList.remove('hidden');
        talkingImage.classList.add('hidden');
        silentImage.classList.add('hidden');
    }
  }
}


const app = {
  init: async() => {

    // Load all images and then set to default state
    animate.setState('silent');

    // Set current threshold cap
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
      let range = [0,0,0,0,0];

      volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;

        for(const volume of volumes) {
          volumeSum += volume;
        }

        // Get average volume and add to array
        const averageVolume = Math.floor(volumeSum / volumes.length);
        range.pop();
        range.unshift(averageVolume);

        // Handle volume information
        voiceHandler.detectVolume(averageVolume, range);

      };
    } catch(e) {
      console.error('Failed to initialize volume visualizer...', e);
    }
  },
  toggleInputs: () => {
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
  },
  setCurrentCap: () => {
    currentCap.innerText = volumeCap;
  }
}

window.addEventListener('load', app.init);

startButton.addEventListener('click', () => {
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
    animate.setState('silent');
  }
});

slider.addEventListener('input', () => {
  volumeCap = slider.value
  app.setCurrentCap();
});

