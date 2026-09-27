import { message } from "ant-design-vue";
import request from "./request";
import type { Ref } from "vue";
import type { ChatMessage } from "@/types/chatTypes";
import type { SelectedFile, FileHandlerOptions } from "../types/untilsTypes";

/**
 * 生成唯一 ID 的工具函数
 */
export const generateFileId = () => Math.random().toString(36).substring(2, 10);

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// 文件图标映射
const fileIconMap: Record<string, string> = {
  // 文档类
  pdf: "iconfont icon-PDF",
  doc: "iconfont icon-word",
  docx: "iconfont icon-word",
  rtf: "iconfont icon-RTF",
  odt: "iconfont icon-tuya-", // OpenDocument 文本
  xls: "iconfont icon-Excel",
  xlsx: "iconfont icon-Excel",
  ods: "iconfont icon-tuya-", // OpenDocument 表格
  csv: "iconfont icon-csv",
  tsv: "iconfont icon-tsv",
  ppt: "iconfont icon-ppt",
  pptx: "iconfont icon-ppt",
  odp: "iconfont icon-tuya-", // OpenDocument 演示
  txt: "iconfont icon-txt",
  md: "iconfont icon-md",
  epub: "iconfont icon-tuya-", // 电子书格式
  mobi: "iconfont icon-tuya-", // Kindle电子书

  // 压缩文件
  zip: "iconfont icon-zip",
  rar: "iconfont icon-zip",
  "7z": "iconfont icon-zip",
  gz: "iconfont icon-zip", // Gzip压缩
  tar: "iconfont icon-zip", // Tar归档
  bz2: "iconfont icon-zip", // Bzip2压缩
  xz: "iconfont icon-zip", // XZ压缩

  // 图片文件
  jpg: "iconfont icon-file-image",
  jpeg: "iconfont icon-file-image",
  png: "iconfont icon-file-image",
  gif: "iconfont icon-file-image",
  bmp: "iconfont icon-file-image",
  webp: "iconfont icon-file-image",
  svg: "iconfont icon-file-image",
  psd: "iconfont icon-wenjian-psd",
  ai: "iconfont icon-tuya-", // Adobe Illustrator
  eps: "iconfont icon-tuya-", // Encapsulated PostScript
  raw: "iconfont icon-tuya-", // RAW图像格式
  tiff: "iconfont icon-tuya-", // TIFF图像

  // 视频文件
  mp4: "iconfont icon-video-file",
  avi: "iconfont icon-video-file",
  mov: "iconfont icon-video-file",
  mkv: "iconfont icon-video-file",
  wmv: "iconfont icon-video-file", // Windows Media Video
  flv: "iconfont icon-video-file", // Flash Video
  webm: "iconfont icon-video-file", // WebM格式
  mpg: "iconfont icon-video-file", // MPEG视频
  mpeg: "iconfont icon-video-file", // MPEG视频
  m4v: "iconfont icon-video-file", // iTunes视频

  // 音频文件
  mp3: "iconfont icon-music-file-o",
  wav: "iconfont icon-music-file-o",
  flac: "iconfont icon-music-file-o",
  aac: "iconfont icon-music-file-o",
  ogg: "iconfont icon-music-file-o", // Ogg Vorbis
  m4a: "iconfont icon-music-file-o", // iTunes音频
  wma: "iconfont icon-music-file-o", // Windows Media Audio
  mid: "iconfont icon-music-file-o", // MIDI音频
  midi: "iconfont icon-music-file-o", // MIDI音频

  // 编程/代码文件
  js: "iconfont icon-js",
  jsx: "iconfont icon-js",
  ts: "iconfont icon-js",
  tsx: "iconfont icon-js",
  html: "iconfont icon-html",
  htm: "iconfont icon-html",
  css: "iconfont icon-file-css",
  scss: "iconfont icon-file-css",
  less: "iconfont icon-file-css",
  vue: "iconfont icon-vue",
  java: "iconfont icon-java",
  php: "iconfont icon-php",
  py: "iconfont icon-python",
  cpp: "iconfont icon-CPP",
  c: "iconfont icon-CPP",
  h: "iconfont icon-CPP",
  cs: "iconfont icon-tuya-", // C#
  rb: "iconfont icon-tuya-", // Ruby
  go: "iconfont icon-tuya-", // Go语言
  rs: "iconfont icon-tuya-", // Rust
  swift: "iconfont icon-tuya-", // Swift
  kt: "iconfont icon-tuya-", // Kotlin
  dart: "iconfont icon-tuya-", // Dart
  lua: "iconfont icon-tuya-", // Lua
  perl: "iconfont icon-tuya-", // Perl
  sh: "iconfont icon-tuya-", // Shell脚本
  bash: "iconfont icon-tuya-", // Bash脚本
  ps1: "iconfont icon-tuya-", // PowerShell脚本
  cmd: "iconfont icon-tuya-", // Windows批处理
  bat: "iconfont icon-tuya-", // Windows批处理

  // 数据库与配置文件
  sql: "iconfont icon-sql",
  mysql: "iconfont icon-tuya-", // MySQL文件
  pgsql: "iconfont icon-tuya-", // PostgreSQL文件
  json: "iconfont icon-json",
  xml: "iconfont icon-xml",
  yaml: "iconfont icon-tuya-", // YAML配置
  yml: "iconfont icon-tuya-", // YAML配置
  toml: "iconfont icon-tuya-", // TOML配置
  ini: "iconfont icon-tuya-", // INI配置
  cfg: "iconfont icon-tuya-", // 配置文件
  env: "iconfont icon-tuya-", // 环境变量文件

  // 字体文件
  woff: "iconfont icon-WOFF",
  woff2: "iconfont icon-WOFF",
  ttf: "iconfont icon-ttf-font",
  otf: "iconfont icon-OTF",

  // 可执行文件与安装包
  exe: "iconfont icon-exe",
  dmg: "iconfont icon-tuya-", // macOS磁盘映像
  iso: "iconfont icon-tuya-", // 光盘映像
  apk: "iconfont icon-tuya-", // Android应用包
  ipa: "iconfont icon-tuya-", // iOS应用包
  jar: "iconfont icon-tuya-", // Java可执行文件

  // 日志与临时文件
  log: "iconfont icon-rizhi",
  tmp: "iconfont icon-tuya-", // 临时文件
  temp: "iconfont icon-tuya-", // 临时文件
  cache: "iconfont icon-tuya-", // 缓存文件
};

// 文件类型标签映射
const fileTypeLabelMap: Record<string, string> = {
  // 文档类
  pdf: "PDF文档",
  doc: "Word文档",
  docx: "Word文档",
  rtf: "RTF文档",
  odt: "OpenDocument文档",
  xls: "Excel表格",
  xlsx: "Excel表格",
  ods: "OpenDocument表格",
  csv: "CSV表格",
  tsv: "TSV表格",
  ppt: "PPT演示",
  pptx: "PPT演示",
  odp: "OpenDocument演示",
  txt: "文本文件",
  md: "Markdown文档",
  epub: "EPUB电子书",
  mobi: "MOBI电子书",

  // 压缩文件
  zip: "压缩文件",
  rar: "压缩文件",
  "7z": "压缩文件",
  gz: "Gzip压缩文件",
  tar: "Tar归档文件",
  bz2: "Bzip2压缩文件",
  xz: "XZ压缩文件",

  // 图片文件
  jpg: "图片文件",
  jpeg: "图片文件",
  png: "图片文件",
  gif: "图片文件",
  bmp: "图片文件",
  webp: "图片文件",
  svg: "SVG矢量图",
  psd: "PSD设计文件",
  ai: "Adobe Illustrator文件",
  eps: "EPS图形文件",
  raw: "RAW图像文件",
  tiff: "TIFF图像文件",

  // 视频文件
  mp4: "视频文件",
  avi: "视频文件",
  mov: "视频文件",
  mkv: "视频文件",
  wmv: "WMV视频文件",
  flv: "Flash视频文件",
  webm: "WebM视频文件",
  mpg: "MPEG视频文件",
  mpeg: "MPEG视频文件",
  m4v: "M4V视频文件",

  // 音频文件
  mp3: "音频文件",
  wav: "音频文件",
  flac: "音频文件",
  aac: "音频文件",
  ogg: "Ogg音频文件",
  m4a: "M4A音频文件",
  wma: "WMA音频文件",
  mid: "MIDI音频文件",
  midi: "MIDI音频文件",

  // 编程/代码文件
  js: "JavaScript文件",
  jsx: "React文件",
  ts: "TypeScript文件",
  tsx: "React TypeScript文件",
  html: "HTML文件",
  htm: "HTML文件",
  css: "CSS样式表",
  scss: "SCSS样式表",
  less: "LESS样式表",
  vue: "Vue组件",
  java: "Java文件",
  php: "PHP文件",
  py: "Python文件",
  cpp: "C++文件",
  c: "C语言文件",
  h: "C/C++头文件",
  cs: "C#文件",
  rb: "Ruby文件",
  go: "Go文件",
  rs: "Rust文件",
  swift: "Swift文件",
  kt: "Kotlin文件",
  dart: "Dart文件",
  lua: "Lua文件",
  perl: "Perl文件",
  sh: "Shell脚本",
  bash: "Bash脚本",
  ps1: "PowerShell脚本",
  cmd: "CMD批处理文件",
  bat: "BAT批处理文件",

  // 数据库与配置文件
  sql: "SQL脚本文件",
  mysql: "MySQL脚本",
  pgsql: "PostgreSQL脚本",
  json: "JSON数据文件",
  xml: "XML文件",
  yaml: "YAML配置文件",
  yml: "YAML配置文件",
  toml: "TOML配置文件",
  ini: "INI配置文件",
  cfg: "配置文件",
  env: "环境变量文件",

  // 字体文件
  woff: "WOFF字体文件",
  woff2: "WOFF2字体文件",
  ttf: "TTF字体文件",
  otf: "OTF字体文件",

  // 可执行文件
  exe: "可执行程序",
  dmg: "DMG磁盘映像",
  iso: "ISO光盘映像",
  apk: "APK安装包",
  ipa: "IPA安装包",
  jar: "JAR可执行文件",

  // 日志与临时文件
  log: "日志文件",
  tmp: "临时文件",
  temp: "临时文件",
  cache: "缓存文件",
};

// MIME 类型映射
const mimeTypeMap: Record<string, string> = {
  // 文档类
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odp: "application/vnd.oasis.opendocument.presentation",
  txt: "text/plain",
  md: "text/markdown",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",

  // 压缩文件
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  gz: "application/gzip",
  tar: "application/x-tar",
  bz2: "application/x-bzip2",
  xz: "application/x-xz",

  // 图片文件
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  svg: "image/svg+xml",
  psd: "image/vnd.adobe.photoshop",
  ai: "application/postscript",
  eps: "application/postscript",
  raw: "image/x-raw",
  tiff: "image/tiff",

  // 视频文件
  mp4: "video/mp4",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  webm: "video/webm",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  m4v: "video/x-m4v",

  // 音频文件
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  aac: "audio/aac",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  wma: "audio/x-ms-wma",
  mid: "audio/midi",
  midi: "audio/midi",

  // 编程/代码文件
  js: "application/javascript",
  jsx: "application/javascript",
  ts: "application/typescript",
  tsx: "application/typescript",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  scss: "text/x-scss",
  less: "text/x-less",
  vue: "text/html",
  java: "text/x-java",
  php: "application/x-httpd-php",
  py: "text/x-python",
  cpp: "text/x-c++src",
  c: "text/x-c",
  h: "text/x-c",
  cs: "text/x-csharp",
  rb: "text/x-ruby",
  go: "text/x-go",
  rs: "text/x-rustsrc",
  swift: "text/x-swift",
  kt: "text/x-kotlin",
  dart: "application/dart",
  lua: "text/x-lua",
  perl: "text/x-perl",
  sh: "application/x-sh",
  bash: "application/x-sh",
  ps1: "application/x-powershell",
  cmd: "application/x-msdos-program",
  bat: "application/x-msdos-program",

  // 数据库与配置文件
  sql: "application/sql",
  mysql: "application/sql",
  pgsql: "application/sql",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  toml: "application/toml",
  ini: "text/plain",
  cfg: "text/plain",
  env: "text/plain",

  // 字体文件
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",

  // 可执行文件
  exe: "application/x-msdownload",
  dmg: "application/x-apple-diskimage",
  iso: "application/x-iso9660-image",
  apk: "application/vnd.android.package-archive",
  ipa: "application/x-itunes-ipa",
  jar: "application/java-archive",

  // 日志与临时文件
  log: "text/plain",
  tmp: "application/octet-stream",
  temp: "application/octet-stream",
  cache: "application/octet-stream",
};

/**
 * 根据文件扩展名获取 MIME 类型
 */
export const getMimeType = (extension: string): string => {
  const ext = extension.toLowerCase();
  return mimeTypeMap[ext] || "application/octet-stream";
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

/**
 * 获取文件名（从消息对象中提取）
 */
export const getFileName = (message: ChatMessage): string => {
  // 🔥 优先使用直接字段
  if (message.fileName) {
    return message.fileName;
  }

  // 🔥 如果是文件类型消息，尝试从 content JSON 中解析
  if (message.messageType === "file" && message.content) {
    try {
      const contentObj =
        typeof message.content === "string"
          ? JSON.parse(message.content)
          : message.content;

      if (contentObj.filename) {
        return contentObj.filename;
      }
    } catch (e) {
      console.warn("解析文件消息内容失败:", e);
    }
  }

  // 🔥 最后从URL中提取文件名
  const url = message.content;
  if (typeof url === "string") {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "未知文件";
  }

  return "未知文件";
};

/**
 * 获取文件图标类名
 */
export const getFileIconClass = (message: ChatMessage): string => {
  const fileName = getFileName(message);
  const ext = getFileExtension(fileName);
  return fileIconMap[ext] || "iconfont icon-tuya-";
};

/**
 * 获取文件类型标签
 */
export const getFileTypeLabel = (message: ChatMessage): string => {
  const fileName = getFileName(message);
  const ext = getFileExtension(fileName);
  return fileTypeLabelMap[ext] || "未知类型";
};

/**
 * 格式化文件大小（支持消息对象或字节数）
 */
export const formatMessageFileSize = (
  messageOrBytes?: ChatMessage | number,
): string => {
  // 🔥 如果传入的是数字（字节数），直接格式化
  if (typeof messageOrBytes === "number" && messageOrBytes > 0) {
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(messageOrBytes) / Math.log(k));
    return (messageOrBytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  }

  const message = messageOrBytes as ChatMessage | undefined;

  // 🔥 如果传入了 message 对象，尝试从多个来源获取文件大小
  if (message) {
    // 优先使用直接字段
    if (message.fileSize && message.fileSize > 0) {
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(message.fileSize) / Math.log(k));
      return (message.fileSize / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
    }

    // 🔥 如果是文件类型消息，尝试从 content JSON 中解析 size
    if (message.messageType === "file" && message.content) {
      try {
        const contentObj =
          typeof message.content === "string"
            ? JSON.parse(message.content)
            : message.content;

        if (contentObj.size && contentObj.size > 0) {
          const k = 1024;
          const sizes = ["B", "KB", "MB", "GB", "TB"];
          const i = Math.floor(Math.log(contentObj.size) / Math.log(k));
          return (contentObj.size / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
        }
      } catch (e) {
        console.warn("解析文件大小失败:", e);
      }
    }
  }

  return "0 B";
};

/**
 * 选择文件 - 创建隐藏的文件输入框，支持多选
 */
export const selectFile = (
  fileInputRef: Ref<HTMLInputElement | null>,
  options: FileHandlerOptions,
) => {
  // 检查是否有已经存在的 input 元素，如果有则先移除
  if (fileInputRef.value && document.body.contains(fileInputRef.value)) {
    document.body.removeChild(fileInputRef.value);
  }

  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true; // 支持多选
  input.style.display = "none"; // 隐藏输入框

  fileInputRef.value = input;

  input.onchange = (event: Event) => {
    handleFileSelect(event, options);
    // 确保元素存在再移除
    if (input.parentNode) {
      input.remove();
    }
  };

  document.body.appendChild(input);
  input.click(); // 触发选择框
};

/**
 * 处理文件选择逻辑 - 验证、批量上传临时文件、添加到预览列表
 */
export const handleFileSelect = async (
  event: Event,
  options: FileHandlerOptions,
) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  // 限制最多选择 5 个文件
  if (options.selectedFiles.value.length + files.length > 5) {
    message.warning("最多只能选择 5 个文件");
    return;
  }

  // 频率限制 - 1 秒内只能选择一次
  const now = Date.now();
  if (
    options.lastFileSelectionTime.value &&
    now - options.lastFileSelectionTime.value < 1000
  ) {
    message.warning("选择文件过于频繁，请稍后再试");
    return;
  }

  options.lastFileSelectionTime.value = now;

  // 验证所有文件
  const validFiles: File[] = [];
  for (const file of Array.from(files)) {
    // 验证文件大小（最大 50MB）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error(`${file.name} 文件大小超过 50MB 限制`);
      continue;
    }

    validFiles.push(file);
  }

  if (validFiles.length === 0) {
    return;
  }

  try {
    // 批量上传所有有效文件
    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await request.post("/message/temp-file", formData);

    // 检查响应数据是否正确
    if (!response.data || !response.data.urls || !response.data.filenames) {
      console.error("临时文件上传失败，响应数据格式不正确:", response.data);
      message.error("文件上传失败，服务器响应异常");
      return;
    }

    const tempUrls = response.data.urls;
    const tempFilenames = response.data.filenames;
    const fileSizes = response.data.sizes || []; // 🔥 获取文件大小数组
    const originalNames = response.data.originalNames || []; // 🔥 获取原始文件名数组
    const mimeTypes = response.data.mimeTypes || []; // 🔥 获取MIME类型数组

    // 确保我们有至少一个 URL 和文件名
    if (tempUrls.length > 0 && tempFilenames.length > 0) {
      // 批量添加到选中文件列表
      validFiles.forEach((file, index) => {
        options.selectedFiles.value.push({
          id: generateFileId(),
          file,
          previewUrl: tempUrls[index] || tempUrls[0], // 🔥 添加预览URL,与图片/视频保持一致
          tempFilename: tempFilenames[index] || tempFilenames[0],
          size: fileSizes[index] || file.size, // 🔥 使用后端返回的文件大小，如果没有则使用本地文件大小
          originalName: originalNames[index] || file.name, // 🔥 使用后端返回的原始文件名
          mimeType: mimeTypes[index] || file.type, // 🔥 使用后端返回的MIME类型
          mediaType: "file",
        });
      });

      console.log("文件批量添加到列表:", options.selectedFiles.value);
    } else {
      console.error("临时文件上传失败，缺少 URL 或文件名:", response.data);
      message.error("文件上传失败，缺少必要的 URL 或文件名");
    }
  } catch (error: any) {
    console.error("批量上传临时文件失败:", error);
    message.error(`文件上传失败：${error.message || error}`);
  }

  // 清空输入框值，支持重复选择同一文件
  if (target) {
    target.value = "";
  }
};

/**
 * 删除选中的文件 - 同时删除临时文件
 */
export const removeFile = async (
  id: string,
  selectedFiles: Ref<SelectedFile[]>,
  lastRemoveFileTimeRef?: Ref<number | null>,
) => {
  // 实现删除频率限制
  if (lastRemoveFileTimeRef) {
    const now = Date.now();
    if (
      lastRemoveFileTimeRef.value &&
      now - lastRemoveFileTimeRef.value < 500
    ) {
      // 0.5 秒内不能重复删除
      message.warning("删除文件过于频繁，请稍后再试");
      return;
    }
    lastRemoveFileTimeRef.value = now;
  }

  const fileIndex = selectedFiles.value.findIndex((file) => file.id === id);
  if (fileIndex !== -1) {
    const file = selectedFiles.value[fileIndex];

    // 🔥 先释放预览 URL，防止内存泄漏(与图片/视频保持一致)
    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    // 如果有临时文件名，调用接口删除临时文件
    if (file.tempFilename) {
      try {
        // 发起删除请求
        await request.delete(`/message/temp-file`, {
          data: { filename: file.tempFilename },
        });
        // 从列表中移除
        selectedFiles.value.splice(fileIndex, 1);
        // 🔥 强制触发响应式更新，确保视图正确刷新
        selectedFiles.value = [...selectedFiles.value];
      } catch (err) {
        console.error("删除临时文件失败:", err);
        // 即使删除失败也要从列表中移除，防止重复尝试
        selectedFiles.value.splice(fileIndex, 1);
        // 🔥 强制触发响应式更新
        selectedFiles.value = [...selectedFiles.value];
        message.error("删除临时文件时出现问题，但文件仍已从列表中移除");
      }
    } else {
      // 没有临时文件名，直接从列表中移除
      selectedFiles.value.splice(fileIndex, 1);
      // 🔥 强制触发响应式更新
      selectedFiles.value = [...selectedFiles.value];
    }
  }
};
