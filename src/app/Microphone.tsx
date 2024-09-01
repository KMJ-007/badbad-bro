"use client"

import Recording from "./recording.svg";
import Siriwave from 'react-siriwave';
import React, { useCallback, useEffect, useState } from 'react'
import { LiveClient, createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { useQueue } from "@uidotdev/usehooks";
import axios from 'axios';

function Microphone() {
  const { add, remove, first, size } = useQueue<Blob>([]);
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [isListening, setListening] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);
  const [userMedia, setUserMedia] = useState<MediaStream | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const toggleMicrophone = useCallback(async () => {
    if (microphone && userMedia) {
      console.log("Stopping microphone");
      setUserMedia(null);
      setMicrophone(null);
      microphone.stop();
    } else {
      console.log("Starting microphone");
      const userMedia = await navigator.mediaDevices.getUserMedia({ audio: true });
      const microphone = new MediaRecorder(userMedia);
      microphone.start(500);

      microphone.onstart = () => {
        console.log("Microphone started");
        setMicOpen(true);
      };
      microphone.onstop = () => {
        console.log("Microphone stopped");
        setMicOpen(false);
      };
      microphone.ondataavailable = (e) => {
        console.log("Audio data available");
        add(e.data);
      };

      setUserMedia(userMedia);
      setMicrophone(microphone);
    }
  }, [add, microphone, userMedia]);

  useEffect(() => {
    const initializeDeepgram = async () => {
      try {
        const response = await fetch("/api/deepgram");
        const { key } = await response.json();
        console.log("Deepgram API key received:", key);
        const deepgram = createClient(key);
        console.log("Deepgram client created");
        const connection = deepgram.listen.live({
          model: "nova",
          interim_results: false,
          language: "en-US",
          smart_format: true,
        });
        console.log("Deepgram connection created");

        connection.on(LiveTranscriptionEvents.Open, () => {
          console.log("Deepgram connection opened");
          setListening(true);
        });
        connection.on(LiveTranscriptionEvents.Close, () => {
          console.log("Deepgram connection closed");
          setListening(false);
          setConnection(null);
        });
        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          console.log("Transcript received:", data);
          handleTranscript(data);
        });
        connection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error("Deepgram error:", error);
        });

        setConnection(connection);
      } catch (error) {
        console.error("Failed to initialize Deepgram:", error);
      }
    };

    initializeDeepgram();
  }, []);

  const handleTranscript = async (data: any) => {
    console.log("Handling transcript:", data);
    if (!data.channel?.alternatives?.[0]?.words) {
      console.error("Unexpected transcript data structure:", data);
      return;
    }
    const words = data.channel.alternatives[0].words;
    const transcription = words.map((word: any) => word.punctuated_word ?? word.word).join(" ");
    console.log("Transcription:", transcription);
    if (transcription && data.is_final) {
      setCaption(transcription);
      try {
        console.log("Sending transcription to chat API");
        const response = await axios.post("/api/chat", { message: transcription });
        console.log("Chat API response:", response.data);
        const aiResponse = response.data.message;
        setCaption(aiResponse);
        playAudioResponse(aiResponse);
      } catch (error) {
        console.error("Error processing AI response:", error);
      }
    }
  };

  const playAudioResponse = async (text: string) => {
    try {
      const response = await axios.post("/api/tts", { text }, { responseType: 'arraybuffer' });
      const blob = new Blob([response.data], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setAudio(audio);
      audio.play();
    } catch (error) {
      console.error("Error playing audio response:", error);
    }
  };

  useEffect(() => {
    const processQueue = async () => {
      if (size > 0 && !isProcessing && isListening && connection && first) {
        setProcessing(true);
        console.log("Sending audio data to Deepgram");
        connection.send(first);
        remove();
        setTimeout(() => setProcessing(false), 250);
      }
    };

    processQueue();
  }, [connection, remove, first, size, isProcessing, isListening]);

  const isAudioPlaying = audio && audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2;

  return (
    <div className="w-full relative">
      <div className="relative flex w-screen flex justify-center items-center max-w-screen-lg place-items-center content-center">
        <Siriwave theme="ios9" autostart={isAudioPlaying || false} />
      </div>
      <div className="mt-10 flex flex-col align-middle items-center">
        <button type="button" className="w-24 h-24" onClick={toggleMicrophone}>
          <Recording
            width="96"
            height="96"
            className={`cursor-pointer ${micOpen ? "fill-red-400 drop-shadow-glowRed" : "fill-gray-600"}`}
          />
        </button>
        <div className="mt-20 p-6 text-xl text-center">{caption}</div>
      </div>
    </div>
  );
}

export default Microphone;