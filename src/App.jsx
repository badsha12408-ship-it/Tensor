import { useRef,useEffect, useState } from 'react'
import './App.css'

export default function App(){
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState("Say");
  const [listening, setListening] = useState(false);
  const ReconigRef = useRef(null);
  const audioRef = useRef(null);
  const [setting, setSetting] = useState(true)
  const restartListening = useRef(false);
  const voiceEnabled = useRef(true)
  const settingRef = useRef({
    tts: true,
    voice:true
  });
  const [device, setDevice] = useState({
    pin:2,
    status:0,
    password: "1234"
  })

  const VCC = [
    "sleep",
    "hey sleep",
    "tensor sleep"
  ]

  const ONC = [
    "on", 
    "turn on"
  ];

  const OFFC = [
    "off",
    "turn off",
    "hey tensor off led",
    "tensor led off",
    "off led tensor"
  ]

  useEffect(()=>{
    CheckDeviceIs();
    const int = setInterval(()=>{
    CheckDeviceIs()
    }, 3000)

    return () => clearInterval(int)
  },[])


  async function CheckDeviceIs() {
    
    try{
      const res = await fetch("http://192.168.10.98/device/status")

      if(!res.ok) throw new Error("Device unrechiable")

      const data = await res.json();

      const statusD = data.connection_status.toLowerCase();
      if(statusD === "connect"){
        setConnected(true)
      }else{
        setConnected(false)
      }
      
      
    }catch(err){
    console.log(err);
    setConnected(false)
  }
}

 

   async function Speak(tv) {
    if(!settingRef.current.tts) return
    try{

    if(audioRef.current){
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(`http://127.0.0.1:8000/speak?text=${encodeURIComponent(tv)}`)
    
    audioRef.current = audio;

    await audio.play()

    audio.onended = () => {
      if(restartListening.current){
        restartListening.current = false;
        StartVoiceCom()
      }
    }
  
  }catch(error){
   console.log(error);
   
  }
   }
   
  
  async function LEDContr(Command) {
    
    try{
      const SerVRes = await fetch("http://192.168.10.98/myDevices",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          pin: device.pin,
          status: Command === "on"? 1 : 0,
          password: device.password
        })
      })
      if(!SerVRes.ok) throw new Error("Error")
      setDevice(prev =>({
      ...prev,
      status: Command === "on" ? 1 : 0
      }))

    }catch(error){
    console.log(error);
    }
  }

  function StartVoiceCom(){
    if(!voiceEnabled.current) return;
    if(listening){
      ReconigRef.current.stop()
      return;
    }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    setText("This browser not supported for command")
    return
  }
  const recofnition = new SpeechRecognition()
  ReconigRef.current = recofnition;

  recofnition.lang = "en-US"
  recofnition.continuous = true;
  recofnition.interimResults = false;

  recofnition.onstart = () => {
    setListening(true)
  }

  recofnition.onresult = (event) => {
  const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
  setText(command)
  
  if(
    ONC.some(word => command.includes(word))
  ){
     LEDContr("on")

    restartListening.current = true

    recofnition.stop()

     Speak("Okay LED turned on");

  }else if(
    OFFC.some(word => command.includes(word))){
       LEDContr("off")
     
      restartListening.current = true

      recofnition.stop()

       Speak("Okay LED turned off")
  }else if(VCC.some(word => command.includes(word))){
    Speak("Iam going to sleep")
    voiceEnabled.current = false
    recofnition.stop()
    return;
  }
  else{
    setText("This is unknwon word")
  };

  }
  

    recofnition.onerror = (event) => {
      console.log(event.error);
    
    setText("ERROR: "+ event.error)
    setListening(false)
    }

    recofnition.onend = async () =>{
    setListening(false)
    setText("Say")
    ReconigRef.current = null
    }

    recofnition.start()
}

 
  


  return (
    <div className='panalDisplay'>
      <div className="panalmainin">
        <div className="readpanal">
          <span className='deviceNameC'>
            <span className='readD'>Device name</span>
           <span className='dN'>DKL9 Pro</span>
          </span>
            <span className='indicat'>{device.status? (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m21 2l-1 1M3 2l1 1m17 13l-1-1M3 16l1-1m5 3h6m-5 3h4M12 3C8 3 5.952 4.95 6 8c.023 1.487.5 2.5 1.5 3.5S9 13 9 15h6c0-2 .5-2.5 1.5-3.5h0c1-1 1.477-2.013 1.5-3.5c.048-3.05-2-5-6-5" />
</svg>):(<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="currentColor" d="M10.799 20.691q-.51-.462-.607-1.152h3.616q-.096.69-.607 1.152T12 21.154t-1.201-.463m5.805-6.63L7.427 4.859q.987-.912 2.116-1.385T12 3q2.721 0 4.61 1.89T18.5 9.5q0 1.506-.538 2.605t-1.358 1.956m3.558 6.37l-.714.713L13.304 15H8.558q-1.417-.929-2.238-2.356T5.5 9.5q0-.52.091-1.08q.092-.562.236-.897l-3.158-3.17l.708-.707zm-4.627-3.662v1H8.5v-1z" />
</svg>
)}</span>
        </div>
       
      <span className='deviceS'>{connected? (<><span className='connected'>Connected</span></> ):( <><span className='disconnected'>Disconnected</span> <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<g fill="none" stroke="rgb(225, 67, 67)" stroke-width="1.5">
		<path stroke-linecap="round" d="m22 8l-3-3m0 0l-3-3m3 3l-3 3m3-3l3-3" />
		<path d="M9 10.03A3.515 3.515 0 0 1 13.97 15" />
		<path stroke-linejoin="round" d="M4.853 19.147c3.196 3.196 8.06 3.707 11.789 1.533c.886-.517 1.33-.776 1.357-1.302s-.471-.89-1.468-1.618c-1.848-1.35-3.667-3-5.48-4.812C9.24 11.136 7.59 9.317 6.24 7.47c-.728-.997-1.092-1.495-1.618-1.468s-.785.47-1.302 1.357c-2.174 3.73-1.663 8.593 1.533 11.79Z" />
	</g>
</svg>

</>)}</span>
<div className="D0101">
      <span className='Status'>{device.status === 1? "LED turned on" : "LED turned off"}</span> <button className='soundS' onClick={()=>{
       setSetting(prev => {
       const newVal = !prev;
        settingRef.current.tts = newVal;
        return newVal;
        })
      }}>{setting? (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<g fill="none" stroke="currentColor" stroke-width="1.5">
		<path d="M3.5 13.857v-3.714a2 2 0 0 1 2-2h2.9a1 1 0 0 0 .55-.165l6-3.956a1 1 0 0 1 1.55.835v14.286a1 1 0 0 1-1.55.835l-6-3.956a1 1 0 0 0-.55-.165H5.5a2 2 0 0 1-2-2Z" />
		<path stroke-linecap="round" d="M20.5 15V9" />
	</g>
</svg>
) : (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<g fill="none" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="m18 14l2-2m2-2l-2 2m0 0l-2-2m2 2l2 2" />
		<path d="M2 13.857v-3.714a2 2 0 0 1 2-2h2.9a1 1 0 0 0 .55-.165l6-3.956a1 1 0 0 1 1.55.835v14.286a1 1 0 0 1-1.55.835l-6-3.956a1 1 0 0 0-.55-.165H4a2 2 0 0 1-2-2Z" />
	</g>
</svg>
)}</button></div>
      <button className='actionBtn' onClick={async()=>{
        const cmnd = device.status === 1?"off" : "on"
        await LEDContr(cmnd)
      }}>
        {device.status === 1? "Turn off": "Turn on"}
      </button>
      <button className='actionBtn' onClick={StartVoiceCom}>
      {listening? "" : text}

      {listening && <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<rect width="6" height="14" x="1" y="4" fill="currentColor">
		<animate id="SVGBoZ3Ab9F" fill="freeze" attributeName="y" begin="0;SVG0XJl4OCs.end-0.25s" dur="0.75s" values="1;5" />
		<animate fill="freeze" attributeName="height" begin="0;SVG0XJl4OCs.end-0.25s" dur="0.75s" values="22;14" />
		<animate fill="freeze" attributeName="opacity" begin="0;SVG0XJl4OCs.end-0.25s" dur="0.75s" values="1;.2" />
	</rect>
	<rect width="6" height="14" x="9" y="4" fill="currentColor" opacity=".4">
		<animate fill="freeze" attributeName="y" begin="SVGBoZ3Ab9F.begin+0.15s" dur="0.75s" values="1;5" />
		<animate fill="freeze" attributeName="height" begin="SVGBoZ3Ab9F.begin+0.15s" dur="0.75s" values="22;14" />
		<animate fill="freeze" attributeName="opacity" begin="SVGBoZ3Ab9F.begin+0.15s" dur="0.75s" values="1;.2" />
	</rect>
	<rect width="6" height="14" x="17" y="4" fill="currentColor" opacity=".3">
		<animate id="SVG0XJl4OCs" fill="freeze" attributeName="y" begin="SVGBoZ3Ab9F.begin+0.3s" dur="0.75s" values="1;5" />
		<animate fill="freeze" attributeName="height" begin="SVGBoZ3Ab9F.begin+0.3s" dur="0.75s" values="22;14" />
		<animate fill="freeze" attributeName="opacity" begin="SVGBoZ3Ab9F.begin+0.3s" dur="0.75s" values="1;.2" />
	</rect>
</svg>
}

      </button>
      </div>
    </div>
  );

}