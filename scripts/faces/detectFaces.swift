// Prints the largest face box found in each image given on the command line, using the macOS Vision framework.
// Output is one JSON object per line with the path and a box normalised to 0..1 with the origin at the top left.
// It is an optional macOS-only helper; its results are stored in faceSources.json so the pipeline itself stays portable.
import Foundation
import Vision

for path in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: path)
    let request = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(url: url, options: [:])
    var line = "{\"path\":\"\(path)\",\"box\":null}"
    if (try? handler.perform([request])) != nil, let faces = request.results, !faces.isEmpty {
        let best = faces.max { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }!
        let b = best.boundingBox
        line = "{\"path\":\"\(path)\",\"box\":{\"x\":\(b.minX),\"y\":\(1 - b.maxY),\"w\":\(b.width),\"h\":\(b.height)}}"
    }
    print(line)
}
