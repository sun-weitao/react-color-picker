import * as React from 'react';
import { draggable } from '../utils/draggable';

interface CanvasProps {
    width?: number;
    height?: number;
}

interface HSB { h: number; s: number; b: number; }
interface RGB { r: number; g: number; b: number; }
interface Point { X: number; Y: number; }

interface State {
    color_slider_width: number;
    slide_btn_left: number;
    color_panel_bg: string;
    show_color: string;
    moved: boolean;
    colorSlider: HTMLDivElement | null;
    bool: boolean;
    rgba: RGB & { a: number };
    point: Point;
    hsb: HSB;
}

export default class CanvasComponent extends React.Component<CanvasProps, State> {
    colorSliderRef = React.createRef<HTMLDivElement>();
    colorPanelRef = React.createRef<HTMLDivElement>();

    state: State = {
        color_slider_width: 500,
        slide_btn_left: 0,
        color_panel_bg: '',
        show_color: '',
        moved: false,
        colorSlider: null,
        bool: false,
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        point: { X: 0, Y: 0 },
        hsb: { h: 0, s: 100, b: 100 }
    };

    static defaultProps = {
        width: 500,
        height: 300
    };

    componentDidMount = (): void => {
        const { colorPanelRef, colorSliderRef } = this;
        if (!colorPanelRef.current || !colorSliderRef.current) return;

        const createDragConfig = (handler: (e: MouseEvent | TouchEvent) => void) => ({
            drag: handler,
            end: handler
        });

        draggable(colorPanelRef.current, createDragConfig(this.handleDrag));
        draggable(colorSliderRef.current, createDragConfig(this.handleDrag2));
        this.setBar(0);
    };

    private getPageCoords = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
        if ('pageX' in event) {
            return { x: event.pageX, y: event.pageY };
        }
        return { x: event.touches[0].pageX, y: event.touches[0].pageY };
    };

    handleDrag = (event: MouseEvent | TouchEvent) => {
        if (!this.colorPanelRef.current) return;
        const { x, y } = this.getPageCoords(event);
        this.setPostion(x, y);
    };

    handleDrag2 = (event: MouseEvent | TouchEvent) => {
        if (!this.colorSliderRef.current) return;
        const { x } = this.getPageCoords(event);
        this.setBar(x);
    };

    setPostion = (x: number, y: number) => {
        const elem = this.colorPanelRef.current;
        if (!elem) return;

        const rect = elem.getBoundingClientRect();
        const elemWidth = elem.clientWidth;
        const elemHeight = elem.offsetHeight;
        const X = Math.max(0, Math.min(x - rect.x, elemWidth)) - 9;
        const Y = Math.max(0, Math.min(y - rect.y, elemHeight)) - 9;

        this.setState({
            point: { X, Y },
            hsb: {
                h: this.state.hsb.h,
                s: 100 * X / elemWidth,
                b: 100 * (elemHeight - Y) / elemHeight
            }
        }, this.setShowColor);
    };

    setShowColor = () => {
        const rgb = this.HSBToRGB(this.state.hsb);
        const { a } = this.state.rgba;
        this.setState({
            rgba: { ...rgb, a },
            show_color: `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
        });
    };

    setBar = (x: number) => {
        const elem = this.colorSliderRef.current;
        if (!elem) return;

        const rect = elem.getBoundingClientRect();
        const elemWidth = elem.offsetWidth;
        const X = Math.max(0, Math.min(x - rect.x, elemWidth));
        const h = 360 * X / elemWidth;

        this.setState({
            hsb: { h, s: this.state.hsb.s, b: this.state.hsb.b },
            slide_btn_left: X
        }, () => {
            const rgb = this.HSBToRGB({ h, s: 100, b: 100 });
            this.setState({ color_panel_bg: `rgba(${rgb.r},${rgb.g},${rgb.b},1)` }, this.setShowColor);
        });
    };

    HSBToRGB = (hsb: HSB): RGB => {
        const h = Math.round(hsb.h) % 360;
        const s = Math.round(hsb.s * 255 / 100);
        const v = Math.round(hsb.b * 255 / 100);

        if (s === 0) return { r: v, g: v, b: v };

        const t1 = v;
        const t2 = (255 - s) * v / 255;
        const t3 = (t1 - t2) * (h % 60) / 60;

        const calc = (rt: number, gt: number, bt: number) => ({ r: Math.round(rt), g: Math.round(gt), b: Math.round(bt) });

        if (h < 60) return calc(t1, t2 + t3, t2);
        if (h < 120) return calc(t1 - t3, t1, t2);
        if (h < 180) return calc(t2, t1, t2 + t3);
        if (h < 240) return calc(t2, t1 - t3, t1);
        if (h < 300) return calc(t2 + t3, t2, t1);
        return calc(t1, t2, t1 - t3);
    };

    rgbToHex = ({ r, g, b }: RGB): string => {
        return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    };

    render() {
        const { hsb, color_panel_bg, point, slide_btn_left, show_color, color_slider_width } = this.state;
        const hexColorText = this.rgbToHex(this.HSBToRGB(hsb));

        const styles = {
            colorPanel: { backgroundColor: color_panel_bg },
            pointer: { top: point.Y, left: point.X },
            colorSlider: { width: color_slider_width },
            sliderBtn: { left: slide_btn_left },
            showColor: { backgroundColor: show_color },
        };

        return (
            <div className="canvas">
                <div className="color-panel" style={styles.colorPanel} ref={this.colorPanelRef}>
                    <div className="pointer" style={styles.pointer}>
                        <div className="shape1" />
                    </div>
                    <div className="bg1" />
                    <div className="bg2" />
                </div>
                <div className="color-slider" ref={this.colorSliderRef} style={styles.colorSlider}>
                    <div className="slider-btn" style={styles.sliderBtn} />
                </div>
                <div className="show-color" style={styles.showColor} />
                <div className="color-text">
                    Hex颜色值：<span>#{hexColorText}</span>
                </div>
            </div>
        );
    }
}