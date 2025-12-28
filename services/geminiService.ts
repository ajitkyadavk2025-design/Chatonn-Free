
import { GoogleGenAI, Type, Modality } from "@google/genai";

export class GeminiService {
  /**
   * Initializes a new GoogleGenAI instance to ensure the latest API key is used.
   */
  private getAi() {
    // API key must be obtained exclusively from process.env.API_KEY.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async chat(message: string): Promise<{ text: string, thinking?: string }> {
    const ai = this.getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    
    let thinkingText = '';
    // Look for a thought part in the response
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        // Thinking tokens are often in parts with a thought field or specific type
        if ((part as any).thought) {
          thinkingText += (part as any).text || '';
        }
      }
    }

    return {
      text: response.text || "I didn't receive a response.",
      thinking: thinkingText || undefined
    };
  }

  async search(message: string): Promise<{ text: string, grounding: any[] }> {
    const ai = this.getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return {
      text: response.text || "",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }

  async generateImage(prompt: string): Promise<string> {
    const ai = this.getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: '1:1' }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      // Iterate through parts to find the image part.
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  }

  async generateVideo(prompt: string): Promise<string> {
    const ai = this.getAi();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");
    
    // Append API key when fetching from the download link as required for Veo.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}

// Static utils for manual audio encoding/decoding as required by Live API rules.
export const audioUtils = {
  decode: (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },

  encode: (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
};
