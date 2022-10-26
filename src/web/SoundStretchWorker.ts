interface SoundStretchWorker extends Worker {
  stretch(audioBuffer: AudioBuffer, options?: {
    pitch?: number, tempo?: number
  }): Promise<AudioBuffer>;

  close(): void;
}

export { SoundStretchWorker }