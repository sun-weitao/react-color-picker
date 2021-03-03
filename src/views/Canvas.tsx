import * as React from 'react';
interface CanvasProps {
    width?: number;
    height?: number;
}
export default class CanvasComponent extends React.Component<CanvasProps, any>
{

    private colorSliderRef = React.createRef<HTMLDivElement>();
    private colorPanelRef = React.createRef<HTMLDivElement>();
    constructor(props: CanvasProps) {
        super(props);
        this.state = {
            //滑動條寬度
            color_slider_width: 500,
            //滑快移動距離
            slide_btn_left: 0,
            //顏色面板背景色
            color_panel_bg: '',
            show_color: '',
            moved: false,
            colorSlider: this.colorSliderRef.current,
            bool: false,
            //RGB顏色
            rgba: {
                r: 0,
                g: 0,
                b: 0,
                a: 1
            },
            point: {
                X: 0,
                Y: 0
            },
            hsb: { h: 0, s: 100, b: 100 }
        }
    }
    static defaultProps = {
        width: 500,
        height: 300
    }
    mousemove = (e: any) => {
        let x = e.pageX;
        let y = e.pageY;
        if (this.state.bool) {
            this.setBar(x);
        } else {
            this.setPostion(x, y);
        }
    }
    mousedown = (e: any, bool: boolean) => {
        let x = e.pageX;
        let y = e.pageY;
        this.setState({
            bool: bool
        })
        if (bool) {
            this.setBar(x);
        } else {
            this.setPostion(x, y);
        }
        this.eventListener(true).listener('mousemove', this.mousemove).listener('mouseup', this.mouseup);
    }
    pointMove = (e: any) => {
        let x = e.pageX;
        let y = e.pageY;
        this.setPostion(x, y);
    }
    pointerMouseDown = (e: any) => {
        let x = e.pageX;
        let y = e.pageY;
        this.setPostion(x, y);
        this.eventListener(true).listener('mousemove', this.pointMove).listener('mouseup', this.mouseup);
    }
    mouseup = () => {
        this.eventListener(false).listener("mousemove", this.mousemove).listener("mouseup", this.mouseup);
    }

    eventListener = (bool: boolean) => {
        return {
            listener: function (type: string, func: any) {
                if (bool) {
                    document.addEventListener(type, func, false);
                } else {
                    document.removeEventListener(type, func, false)
                }
                return this;
            }
        }
    }
    setColor = () => {
        return {
            showColor: function (color: any) {
                return this;
            },
            colorPanel: function (color: any) {
                return this;
            }
        }
    }
    /**
     * 拾色板移動
     * @param x 
     * @param y 
     */
    setPostion = (x: number, y: number) => {
        let elem = (this.colorPanelRef as any).current;
        if (elem) {
            let rect = elem.getBoundingClientRect();
            let elem_width = elem.clientWidth;
            let elem_height = elem.offsetHeight;
            let X = Math.max(0, Math.min(x - rect.x, elem_width));
            let Y = Math.max(0, Math.min(y - rect.y, elem_height));
            X -= 9;
            Y -= 9;

            this.setState({
                point: {
                    X, Y
                },
                hsb: {
                    h: this.state.hsb.h,
                    s: Number(100 * X / elem_width),
                    b: Number(100 * (elem_height - Y) / elem_height)
                }
            }, () => {
                this.setShowColor();
            })

        }
    }
    setShowColor = () => {
        let rgb = this.HSBToRGB(this.state.hsb);
        this.setState({
            rgba: {
                ...rgb,
                a: this.state.rgba.a
            },
            show_color: `rgba(${rgb.r},${rgb.g},${rgb.b},${this.state.rgba.a})`
        })
    }
    /**
     * 滑動條移動
     * @param x 
     */
    setBar = (x: number) => {
        const elem = (this.colorSliderRef as any).current;
        if (elem) {
            let rect = elem.getBoundingClientRect();
            let elem_width = elem.offsetWidth;
            let X = Math.max(0, Math.min(x - rect.x, elem_width));
            let h = (360 * X / elem_width);
            let hsb = {
                h: Number(h),
                s: 100,
                b: 100
            }
            this.setState({
                hsb,
                slide_btn_left: X
            }, () => {
                let rgb = this.HSBToRGB(hsb);
                this.setState({
                    color_panel_bg: `rgba(${rgb.r},${rgb.g},${rgb.b},1)`
                }, () => {
                    this.setShowColor();
                })
            })

        }
    }

    HSBToRGB = (hsb: any) => {
        let rgb = {
            r: 0,
            g: 0,
            b: 0
        }
        var h = Math.round(hsb.h);
        var s = Math.round(hsb.s * 255 / 100);
        var v = Math.round(hsb.b * 255 / 100);

        if (s == 0) {
            rgb.r = rgb.g = rgb.b = v;
        } else {
            var t1 = v;
            var t2 = (255 - s) * v / 255;
            var t3 = (t1 - t2) * (h % 60) / 60;

            if (h == 360) h = 0;

            if (h < 60) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3 }
            else if (h < 120) { rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3 }
            else if (h < 180) { rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3 }
            else if (h < 240) { rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3 }
            else if (h < 300) { rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3 }
            else if (h < 360) { rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3 }
            else { rgb.r = 0; rgb.g = 0; rgb.b = 0 }
        }
        return { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b) };
    }
    rgbToHex = (rgb: any) => {
        let hex: any[] = [
            rgb.r.toString(16),
            rgb.g.toString(16),
            rgb.b.toString(16)
        ];
        hex.forEach((str, i) => {
            if (str.length == 1) {
                hex[i] = '0' + str;
            }
        });
        return hex.join('');
    }


    render() {
        return (
            <div className="canvas">
                <div className="color-panel"
                    style={{
                        backgroundColor: this.state.color_panel_bg
                    }}
                    ref={this.colorPanelRef}
                    onMouseDown={(e) => {
                        this.mousedown(e, false);
                    }}
                >
                    <div className="pointer" style={{
                        top: this.state.point.Y,
                        left: this.state.point.X
                    }}>
                        <div className="shape1"></div>
                    </div>
                    <div className="bg1"></div>
                    <div className="bg2"></div>
                </div>
                <div className="color-slider"
                    ref={this.colorSliderRef}
                    style={{
                        width: this.state.color_slider_width
                    }}
                    onMouseDown={(e) => {
                        this.mousedown(e, true);
                    }}
                >
                    <div className="slider-btn" style={{
                        left: this.state.slide_btn_left,
                    }}></div>
                </div>
                <div className="show-color" style={{
                    backgroundColor: this.state.show_color
                }}></div>
            </div>
        )
    }
}