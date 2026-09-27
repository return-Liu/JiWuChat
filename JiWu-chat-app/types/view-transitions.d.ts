// 为 View Transition API 添加类型声明
interface Document {
  startViewTransition?(callback: () => void): any;
}