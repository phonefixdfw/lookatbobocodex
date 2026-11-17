"""Add a short, softened gust under the final syllable of the win line."""
import array
import math
import random
import sys
import wave

with wave.open(sys.argv[1], "rb") as source:
    parameters = source.getparams()
    samples = array.array("h", source.readframes(source.getnframes()))

rate = parameters.framerate
length = round(.76 * rate)
start = max(0, len(samples) - round(.52 * rate))
samples.extend([0] * max(0, start + length - len(samples)))
rng = random.Random(11)
noise = 0
for index in range(length):
    noise = .94 * noise + .06 * rng.uniform(-1, 1)
    gain = math.sin(math.pi * index / length) ** 2
    samples[start + index] = max(-32768, min(32767, samples[start + index] + round(8500 * noise * gain)))

with wave.open(sys.argv[2], "wb") as output:
    output.setparams(parameters)
    output.writeframes(samples.tobytes())
