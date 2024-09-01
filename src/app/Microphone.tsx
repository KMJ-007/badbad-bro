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
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isProcessingTTS, setIsProcessingTTS] = useState(false);

  const toggleMicrophone = useCallback(async () => {
    if (isProcessingTTS) return; // Disable mic during TTS playback
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
  }, [add, microphone, userMedia, isProcessingTTS]);

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
        setIsProcessingChat(true);
        const response = await axios.post("/api/chat", { message: transcription });
        console.log("Chat API response:", response.data);
        const aiResponse = response.data.message;
        setCaption(aiResponse);
        setIsProcessingChat(false);
        playAudioResponse(aiResponse);
      } catch (error) {
        console.error("Error processing AI response:", error);
        setIsProcessingChat(false);
      }
    }
  };

  const playAudioResponse = async (text: string) => {
    try {
      setIsProcessingTTS(true);
      const response = await axios.post("/api/tts", { text }, { responseType: 'arraybuffer' });
      const blob = new Blob([response.data], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setAudio(audio);
      audio.play();
      audio.onended = () => setIsProcessingTTS(false); // Re-enable mic after TTS playback
    } catch (error) {
      console.error("Error playing audio response:", error);
      setIsProcessingTTS(false);
    }
  };

  useEffect(() => {
    const processQueue = async () => {
      if (size > 0 && !isProcessing && isListening && connection && first) {
        setProcessing(true);
        setIsProcessingAudio(true);
        console.log("Sending audio data to Deepgram");
        connection.send(first);
        remove();
        setTimeout(() => {
          setProcessing(false);
          setIsProcessingAudio(false);
        }, 250);
      }
    };

    processQueue();
  }, [connection, remove, first, size, isProcessing, isListening]);

  const isAudioPlaying = audio && audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2;
  const isAnyProcessing = isProcessingAudio || isProcessingChat || isProcessingTTS;

  return (
    <div className="w-full max-w-xl mx-auto text-center text-gray-300 p-6">
      <h1 className="text-6xl font-extrabold text-red-500 mb-3 animate-pulse">BadBad-Bro</h1>
      <p className="text-xl mb-10 italic text-gray-400">"Turning your mediocre ideas into catastrophes since 2023"</p>
      
      <div className="relative w-full h-80 bg-gray-800 rounded-2xl border-4 border-red-500 overflow-hidden mb-10 shadow-lg">
        <Siriwave 
          theme="ios9"
          autostart={isAudioPlaying || isAnyProcessing}
          speed={isAnyProcessing ? 0.1 : 0.05}
          amplitude={isAnyProcessing ? 1.5 : 1}
          className="absolute inset-0 opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            type="button" 
            className={`w-40 h-40 rounded-full transition-all duration-300 shadow-xl ${
              micOpen ? "bg-red-600 animate-pulse" : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={toggleMicrophone}
            disabled={isAnyProcessing}
          >
            <Recording
              width="80"
              height="80"
              className={`mx-auto ${micOpen ? "fill-white" : "fill-gray-400"}`}
            />
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-xl border-4 border-red-500 p-8 text-center shadow-lg">
        {isProcessingAudio && <p className="text-blue-400 animate-pulse text-lg">🎧 Decoding your verbal masterpiece...</p>}
        {isProcessingChat && <p className="text-green-400 animate-pulse text-lg">🤔 AI having an existential crisis over your input...</p>}
        {isProcessingTTS && <p className="text-purple-400 animate-pulse text-lg">🗣️ Preparing a response to shatter your dreams...</p>}
        {caption && (
          <p className="mt-4 text-2xl font-semibold text-gray-300 animate-fadeIn">
            {caption.split(' ').map((word, index) => (
              <span key={`word-${index}`} className="inline-block animate-glitch" style={{animationDelay: `${index * 0.1}s`}}>
                {word}{' '}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="mt-10 text-gray-500">
        <p className="text-base">Powered by AI with a superiority complex</p>
        <p className="text-sm mt-2">Warning: May cause sudden urges to question all your life choices</p>
      </div>
    </div>
  );
}

export default Microphone;