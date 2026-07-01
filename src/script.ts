import { useRef, useState } from "react";
import "./App.css";

export default function App() {
  const [ledOn, setLedOn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState(false);
  const [text, setText] = useState("Say");
  const [listening, setListening] = useState(false);

  const ReconigRef = useRef(null);

  const ONC = [
    "on",
    "turn on",
    "led on",
    "turn on led",
    "switch on",
  ];

  const OFFC = [
    "off",
    "turn off",
    "led off",
    "turn off led",
    "switch off",
  ];

  function Speak(msg) {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(msg);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
  }

  async function LEDContr(command) {
    try {
      const res = await fetch(
        `http://192.168.10.98/Activity_1?status=${command}`
      );

      if (!res.ok) throw new Error("Request Failed");

      const isOn = command === "on";

      setLedOn(isOn);
      setStatus(isOn);
      setConnected(true);

      // microphone off
      ReconigRef.current?.abort();

      // wait a little
      setTimeout(() => {
        if (isOn) {
          Speak("LED turned on");
        } else {
          Speak("LED turned off");
        }
      }, 300);
    } catch (err) {
      console.log(err);
      setConnected(false);
    }
  }

  function StartVoiceCom() {
    if (listening) {
      ReconigRef.current?.abort();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setText("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    ReconigRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = async (event) => {
      const command =
        event.results[event.results.length - 1][0].transcript.toLowerCase();

      setText(command);

      if (ONC.some((word) => command.includes(word))) {
        await LEDContr("on");
      } else if (OFFC.some((word) => command.includes(word))) {
        await LEDContr("off");
      } else {
        setText("Unknown Command");
      }
    };

    recognition.onerror = (event) => {
      console.log(event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setText("Say");
    };

    recognition.start();
  }

  return (
    <div className="panalDisplay">
      <div className="panalmainin">

        <span>{connected ? "Connected" : "Disconnected"}</span>

        <br />

        <span>{status ? "LED turned on" : "LED turned off"}</span>

        <br /><br />

        <button
          onClick={() => LEDContr(ledOn ? "off" : "on")}
        >
          {ledOn ? "Turn Off" : "Turn On"}
        </button>

        <button onClick={StartVoiceCom}>
          {listening ? "Listening..." : text}
        </button>

      </div>
    </div>
  );
}