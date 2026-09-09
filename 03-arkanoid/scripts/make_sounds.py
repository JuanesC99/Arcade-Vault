"""Sintetiza los tres efectos de sonido de la spec 04.

Genera WAV con numpy y los convierte a mp3 con ffmpeg.
Uso: python scripts/make_sounds.py
Salida: assets/sounds/powerup.mp3, life-lost.mp3, level-complete.mp3
"""

import os
import subprocess
import wave

import numpy as np

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def envelope(n, attack=0.01, release=0.25):
    """Envolvente attack/release lineal sobre n muestras."""
    a = max(1, int(SR * attack))
    r = max(1, int(SR * release))
    env = np.ones(n)
    env[:a] = np.linspace(0, 1, a)
    if r < n:
        env[-r:] = np.linspace(1, 0, r)
    return env


def square(freq, dur, duty=0.5):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    return np.where((t * freq) % 1 < duty, 1.0, -1.0)


def sine(freq, dur):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    return np.sin(2 * np.pi * freq * t)


def glide(f0, f1, dur):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq = np.linspace(f0, f1, t.size)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase)


def write(name, samples):
    peak = np.max(np.abs(samples)) or 1.0
    pcm = (samples / peak * 0.8 * 32767).astype('<i2')

    wav_path = os.path.join(OUT_DIR, name + '.wav')
    mp3_path = os.path.join(OUT_DIR, name + '.mp3')

    with wave.open(wav_path, 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())

    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-b:a', '96k', mp3_path],
        check=True,
    )
    os.remove(wav_path)
    print('escrito', mp3_path)


def make_powerup():
    """Arpegio ascendente corto y brillante al atrapar una cápsula."""
    notes = [523.25, 659.25, 783.99, 1046.50]  # C5 E5 G5 C6
    parts = [square(f, 0.07, 0.35) * envelope(int(SR * 0.07), 0.004, 0.03) for f in notes]
    return np.concatenate(parts)


def make_life_lost():
    """Caída descendente al perder la última bola."""
    tone = glide(440, 110, 0.55)
    return tone * envelope(tone.size, 0.01, 0.35)


def make_level_complete():
    """Fanfarria de tríada mayor al completar un nivel."""
    seq = [(523.25, 0.11), (659.25, 0.11), (783.99, 0.11), (1046.50, 0.42)]
    parts = []
    for freq, dur in seq:
        n = int(SR * dur)
        voice = square(freq, dur, 0.5) * 0.6 + sine(freq * 2, dur) * 0.4
        parts.append(voice * envelope(n, 0.006, min(0.3, dur * 0.7)))
    return np.concatenate(parts)


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    write('powerup', make_powerup())
    write('life-lost', make_life_lost())
    write('level-complete', make_level_complete())
