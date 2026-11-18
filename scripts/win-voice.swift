import AVFoundation
import Foundation

let line = "Your did it! You wind."
let windRange = (line as NSString).range(of: "wind")
let speech = NSMutableAttributedString(string: line)
speech.addAttribute(
    NSAttributedString.Key(rawValue: AVSpeechSynthesisIPANotationAttribute),
    value: "wɪnd",
    range: windRange
)

let utterance = AVSpeechUtterance(attributedString: speech)
guard let voice = AVSpeechSynthesisVoice(identifier: "com.apple.voice.compact.en-US.Samantha") else {
    fatalError("Install the macOS Samantha voice before generating the win line.")
}
utterance.voice = voice
utterance.rate = 0.43

let destination = URL(fileURLWithPath: CommandLine.arguments[1])
let synthesizer = AVSpeechSynthesizer()
var file: AVAudioFile?
var complete = false
var wroteFrames = false
synthesizer.write(utterance, toBufferCallback: { buffer in
    guard let pcm = buffer as? AVAudioPCMBuffer, pcm.frameLength > 0 else {
        complete = true
        return
    }
    do {
        if file == nil {
            file = try AVAudioFile(forWriting: destination, settings: pcm.format.settings,
                                   commonFormat: pcm.format.commonFormat, interleaved: pcm.format.isInterleaved)
        }
        try file?.write(from: pcm)
        wroteFrames = true
    } catch {
        fatalError("Unable to save the win line: \(error)")
    }
})
let deadline = Date().addingTimeInterval(25)
while !complete && Date() < deadline {
    RunLoop.current.run(until: Date().addingTimeInterval(0.05))
}
guard complete && wroteFrames else {
    fatalError("The speech synthesizer did not finish the win line.")
}
file = nil
