// Analyses source photos with the macOS Vision framework: lifts the subject out of the background and finds face landmarks.
// For each image it writes <outDir>/<name>.mask.png (white = subject) and prints one JSON line with the face box, eye and
// mouth positions normalised to 0..1 with the origin at the top left. Results are cached data, so the pipeline stays portable.
import CoreImage
import Foundation
import Vision

struct Point: Encodable { let x: Double; let y: Double }
struct Analysis: Encodable {
    let path: String
    let box: [String: Double]?
    let eyeA: Point?
    let eyeB: Point?
    let mouth: Point?
    let mouthWidth: Double?
    let mask: Bool
}

func toImage(_ p: CGPoint, _ b: CGRect) -> Point {
    Point(x: Double(b.minX + p.x * b.width), y: Double(1 - (b.minY + p.y * b.height)))
}

func center(_ region: VNFaceLandmarkRegion2D?, _ b: CGRect) -> Point? {
    guard let pts = region?.normalizedPoints, !pts.isEmpty else { return nil }
    let sx = pts.reduce(0.0) { $0 + Double($1.x) } / Double(pts.count)
    let sy = pts.reduce(0.0) { $0 + Double($1.y) } / Double(pts.count)
    return toImage(CGPoint(x: sx, y: sy), b)
}

func writeMask(_ handler: VNImageRequestHandler, to url: URL) -> Bool {
    let request = VNGenerateForegroundInstanceMaskRequest()
    guard (try? handler.perform([request])) != nil, let obs = request.results?.first,
          let buffer = try? obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler) else { return false }
    let image = CIImage(cvPixelBuffer: buffer)
    let gray = CGColorSpaceCreateDeviceGray()
    return (try? CIContext().writePNGRepresentation(of: image, to: url, format: .L8, colorSpace: gray)) != nil
}

let args = Array(CommandLine.arguments.dropFirst())
let outDir = URL(fileURLWithPath: args[0])
let encoder = JSONEncoder()
for path in args.dropFirst() {
    let url = URL(fileURLWithPath: path)
    let handler = VNImageRequestHandler(url: url, options: [:])
    let name = url.deletingPathExtension().lastPathComponent
    let mask = writeMask(handler, to: outDir.appendingPathComponent("\(name).mask.png"))
    let request = VNDetectFaceLandmarksRequest()
    var result = Analysis(path: path, box: nil, eyeA: nil, eyeB: nil, mouth: nil, mouthWidth: nil, mask: mask)
    if (try? handler.perform([request])) != nil, let faces = request.results, !faces.isEmpty {
        let face = faces.max { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }!
        let b = face.boundingBox
        let lips = face.landmarks?.outerLips?.normalizedPoints ?? []
        let width = lips.isEmpty ? nil : Double((lips.map { $0.x }.max()! - lips.map { $0.x }.min()!) * b.width)
        result = Analysis(
            path: path,
            box: ["x": Double(b.minX), "y": Double(1 - b.maxY), "w": Double(b.width), "h": Double(b.height)],
            eyeA: center(face.landmarks?.leftPupil ?? face.landmarks?.leftEye, b),
            eyeB: center(face.landmarks?.rightPupil ?? face.landmarks?.rightEye, b),
            mouth: center(face.landmarks?.outerLips, b),
            mouthWidth: width,
            mask: mask
        )
    }
    print(String(data: try! encoder.encode(result), encoding: .utf8)!)
}
