import Foundation
import CoreGraphics
import CoreText
import ImageIO
let output=CommandLine.arguments[1]
let width=1200,height=630
let ctx=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
func colour(_ r:CGFloat,_ g:CGFloat,_ b:CGFloat)->CGColor{CGColor(red:r/255,green:g/255,blue:b/255,alpha:1)}
ctx.setFillColor(colour(17,19,15));ctx.fill(CGRect(x:0,y:0,width:width,height:height))
ctx.setStrokeColor(colour(92,103,76));ctx.setLineWidth(1);ctx.move(to:CGPoint(x:64,y:518));ctx.addLine(to:CGPoint(x:1136,y:518));ctx.strokePath()
func text(_ value:String,_ size:CGFloat,_ x:CGFloat,_ y:CGFloat,_ colour:CGColor,_ bold:Bool=false){let font=CTFontCreateWithName((bold ? "HelveticaNeue-Bold":"HelveticaNeue") as CFString,size,nil);let attrs:[CFString:Any]=[kCTFontAttributeName:font,kCTForegroundColorAttributeName:colour];let line=CTLineCreateWithAttributedString(NSAttributedString(string:value,attributes:attrs as [NSAttributedString.Key:Any]));ctx.textPosition=CGPoint(x:x,y:y);CTLineDraw(line,ctx)}
text("THRUPUT LABS",18,64,546,colour(184,155,119),true)
text("Thruput Labs",112,58,306,colour(220,224,207),true)
text("Workflow automation. Custom software.",33,64,218,colour(170,183,151))
text("SEO. GEO. AEO.",33,64,170,colour(170,183,151))
ctx.setFillColor(colour(187,134,90));ctx.fill(CGRect(x:64,y:64,width:84,height:4))
let image=ctx.makeImage()!
let url=URL(fileURLWithPath:output)
let destination=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!
CGImageDestinationAddImage(destination,image,nil)
if !CGImageDestinationFinalize(destination){fatalError("Could not write social image")}
