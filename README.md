# React Color Picker

基于 React 的颜色选择器组件，支持 HSB/RGB/Hex 颜色模型转换，提供直观的拾色器界面。

## 运行

```bash
pnpm install
pnpm start
```

## 代码结构

```
src/
├── views/
│   └── Canvas.tsx          # 颜色选择器主组件
├── utils/
│   └── draggable.ts        # 拖拽工具函数
├── App.tsx                 # 应用入口
├── App.css                 # 组件样式
├── index.tsx               # React 渲染入口
└── index.css               # 全局样式
```

### 核心模块

| 文件 | 职责 |
|------|------|
| `Canvas.tsx` | 颜色选择器主组件，管理状态和颜色转换 |
| `draggable.ts` | 通用拖拽工具，支持鼠标和触控事件 |

## 实现原理

### 1. 颜色模型

组件采用 **HSB 颜色模型**（色相、饱和度、亮度）作为内部表示：

- **H (Hue)**: 0-360°，通过颜色滑块选择
- **S (Saturation)**: 0-100%，通过颜色面板水平位置确定
- **B (Brightness)**: 0-100%，通过颜色面板垂直位置确定

### 2. HSB 转 RGB 算法

```
HBS → RGB 转换算法位于 Canvas.tsx 的 HSBToRGB 方法：

1. 当 S=0 时，RGB = (V, V, V)（灰色）
2. 否则，根据 H 值所在区间计算：
   - t1 = V
   - t2 = (255 - S) * V / 255
   - t3 = (t1 - t2) * (H % 60) / 60
   - 根据 6 个 60° 区间应用不同公式
```

### 3. 拖拽机制

`draggable.ts` 实现统一拖拽处理：

```
mousedown/touchstart → 绑定全局 move/end 监听
mousemove/touchmove  → 调用 drag 回调
mouseup/touchend     → 解绑监听，调用 end 回调
```

特性：
- 支持鼠标和触控双端
- 防止选择和拖拽默认行为
- 状态锁防止重复拖拽

### 4. 颜色面板原理

```
面板结构：
┌─────────────────────────────┐
│ bg1: 白→透明渐变 (饱和度)     │  ↑
│ bg2: 透明→黑渐变 (亮度)       │  Y轴：亮度
│ pointer: 选色光标            │  ↓
└─────────────────────────────┘
  X轴：饱和度 →

pointer 位置 → 计算 (S, B) → 更新 HSB → 转 RGB/Hex
```

### 5. 颜色滑块原理

滑块渐变：`hsl(0,100%,50%) → hsl(60,100%,50%) → ... → hsl(360,100%,50%)`

```
滑块位置 X → hue = 360 * X / width → 更新色相 H → 更新面板背景色
```

## 二次开发

### 添加新的颜色格式输出

在 `Canvas.tsx` 中扩展 `rgbToHex` 方法或添加新转换方法：

```tsx
// 添加 RGBA 字符串输出
rgbToRgbaString = ({ r, g, b }: RGB, a: number): string => {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// 添加 HSL 字符串输出
rgbToHslString = ({ r, g, b }: RGB): string => {
    // RGB → HSL 转换逻辑
};
```

### 修改面板尺寸

通过 props 或 state 调整：

```tsx
// 在 CanvasProps 中添加
interface CanvasProps {
    width?: number;
    height?: number;
    panelWidth?: number;
    panelHeight?: number;
}

// 修改 state 默认值
state = {
    color_slider_width: this.props.panelWidth || 500,
    // ...
};
```

### 添加颜色预设栏

在 `render()` 中添加预设颜色数组：

```tsx
const presetColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

return (
    <div className="canvas">
        {/* 现有代码 */}
        <div className="preset-colors">
            {presetColors.map(color => (
                <div
                    key={color}
                    className="preset-color"
                    style={{ backgroundColor: color }}
                    onClick={() => this.setColorFromHex(color)}
                />
            ))}
        </div>
    </div>
);
```

### 添加透明度滑块

1. 在 state 中添加 `alpha` 状态
2. 添加透明度滑块 UI
3. 修改 `rgba` 颜色输出

```tsx
setAlpha = (x: number) => {
    const elem = this.alphaSliderRef.current;
    if (!elem) return;
    const rect = elem.getBoundingClientRect();
    const a = Math.max(0, Math.min(x - rect.x, elem.offsetWidth)) / elem.offsetWidth;
    this.setState({ rgba: { ...this.state.rgba, a } }, this.setShowColor);
};
```

### 暴露颜色值给父组件

通过 props 回调将选中的颜色通知父组件：

```tsx
interface CanvasProps {
    width?: number;
    height?: number;
    onColorChange?: (color: { hsb: HSB; rgb: RGB; hex: string }) => void;
}

// 在 setShowColor 中调用
setShowColor = () => {
    const rgb = this.HSBToRGB(this.state.hsb);
    const hex = this.rgbToHex(rgb);
    this.props.onColorChange?.({ hsb: this.state.hsb, rgb, hex });
};
```

### 修改拖拽灵敏度

在 `draggable.ts` 中调整坐标计算，或在 Canvas 中对获取的坐标做预处理：

```tsx
handleDrag = (event: MouseEvent | TouchEvent) => {
    const { x, y } = this.getPageCoords(event);
    // 添加灵敏度系数
    const sensitivity = 1.2;
    this.setPostion(x * sensitivity, y * sensitivity);
};
```

### 导出为独立组件

将 Canvas 提取为独立 npm 包：

1. 移除 React 依赖外的代码
2. 完善 props 接口定义
3. 添加 default export
4. 发布到 npm

## API

### Canvas Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `500` | 画布宽度 |
| `height` | `number` | `300` | 面板高度 |

### Draggable Options

| Option | Type | Description |
|--------|------|-------------|
| `drag` | `(event) => void` | 拖拽中回调 |
| `start` | `(event) => void` | 开始拖拽回调 |
| `end` | `(event) => void` | 结束拖拽回调 |

## 浏览器兼容

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
