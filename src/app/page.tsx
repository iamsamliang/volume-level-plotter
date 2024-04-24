'use client'

import { useState, useEffect, useRef, ChangeEvent } from "react";

export default function Home() {

  const [volume, setVolume] = useState(0);
  const [volumeArr, setVolumeArr] = useState<number[]>([]);
  const intervalWidthRef = useRef(10);
  const canvasRef = useRef(null);
  const volumeArrRef = useRef(volumeArr);
  const freqValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const [freqData, setFreqData] = useState<number>(freqValues[0]);
  const freqDataRef = useRef(freqData);
  
  function handleClick(e: ChangeEvent<HTMLSelectElement>) {
    setVolumeArr([]);
    setFreqData(Number(e.target.value));
  }

  useEffect(() => {
    freqDataRef.current = freqData;
  }, [freqData]);

  useEffect(() => {
    volumeArrRef.current = volumeArr;
  }, [volumeArr]);

  useEffect(() => {
    intervalWidthRef.current = canvasRef.current.width/freqDataRef.current
  }, [freqData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = "green"

    navigator.mediaDevices.getUserMedia({
        audio: true,
      })
        .then(function(stream) {
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

          analyser.smoothingTimeConstant = 0.8;
          analyser.fftSize = 1024;

          microphone.connect(analyser);
          analyser.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
          scriptProcessor.onaudioprocess = function() {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            const arraySum = array.reduce((a, value) => a + value, 0);
            const average = arraySum / array.length;
            setVolume(average);

            if (volumeArrRef.current.length < freqDataRef.current) {
              setVolumeArr([...volumeArrRef.current, average]);
            }
            else {
              const copyOfVol = [...volumeArrRef.current];
              copyOfVol.splice(0, 1);
              setVolumeArr([...copyOfVol, average]);
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
            volumeArrRef.current.forEach((volume, idx) => {
              
              if (volume === 0) {
                context.fillRect(idx*intervalWidthRef.current, canvas.height-volume, 1, volume);
              } else {
                context.fillRect(idx*intervalWidthRef.current, canvas.height-(volume*5), 1, (volume*5));
              }
            });
          };
        })
        .catch(function(err) {
          /* handle the error */
          console.error(err);
        });
  }, []);



  return (
    <main className="flex min-h-screen items-center justify-between p-24">
      <div className="flex">
        Current Volume: {volume}
      </div>
      <div className={`flex flex-col gap-4 w-[500px] h-[500px]`}>
        <h1 className="flex items-center justify-center p-2 border-b border-b-neutral-600">Volume Over Time</h1>
        <canvas className='w-full h-full' ref={canvasRef} />
        <div className="flex gap-4 justify-center items-center">
            <label htmlFor="frequency">Choose a frequency: </label>
            <select name="freqVal" id="frequency" value={freqData} className="max-w-fit text-black" onChange={(e) => {handleClick(e)}}>
              {freqValues.map((freq, idx) => <option value={freq} key={idx}>{freq}</option>)}
            </select>

        </div>
      </div>
    </main>
  );
}
