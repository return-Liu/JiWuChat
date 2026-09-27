import request from "../untils/request";
import type {
  ProcessReportParams,
  ProcessReportResponse,
  SubmitReportData,
  UploadedFile,
} from "../types/untilsTypes";

/**
 * 举报相关工具函数
 */

/**
 * 上传文件到服务器临时目录
 * @param files 要上传的文件数组
 * @returns 上传成功后的文件对象数组
 */
export async function uploadTempFiles(files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await request.post("/report/upload-temp", formData);

  const responseData = response.data?.message?.data || response.data;
  if (responseData && responseData.files) {
    return responseData.files.map((fileInfo: any) => ({
      name: fileInfo.name,
      type: fileInfo.type,
      size: fileInfo.size,
      url: fileInfo.url,
      tempFilename: fileInfo.tempFilename,
      file: null as any,
    }));
  }

  return [];
}

/**
 * 删除临时文件
 * @param tempFilenames 临时文件名数组
 */
export async function deleteTempFiles(tempFilenames: string[]): Promise<void> {
  if (!tempFilenames || tempFilenames.length === 0) {
    return;
  }

  try {
    await request.delete("/report/temp-files", {
      data: { tempFilenames },
    });
  } catch (error) {
    console.error("删除临时文件失败:", error);
  }
}

/**
 * 提交举报数据
 * @param data 举报数据
 * @returns 接口响应
 */
export async function submitReport(data: SubmitReportData): Promise<any> {
  const payload: any = {
    reason: data.reason,
    description: data.description,
  };

  if (data.isGroup) {
    payload.reportedGroupId = String(data.contactId);
  } else {
    payload.reportedUserId = String(data.contactId);
  }

  if (data.tempFiles && data.tempFiles.length > 0) {
    payload.tempFiles = data.tempFiles;
  }

  return await request.post("/report", payload);
}

/**
 * 撤销文件 URL（用于删除临时上传的文件）
 * @param fileUrls 文件 URL 数组
 */
export async function revokeFileUrls(fileUrls: string[]): Promise<void> {
  // 如果是临时文件，需要调用删除接口
  // 这里可以根据实际需求实现
  console.log("撤销文件 URLs:", fileUrls);
}

/**
 * 获取用户的举报记录列表
 * @param params 查询参数
 * @returns 举报记录列表
 */
export async function getReportList(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append("page", String(params.page));
  }
  if (params?.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }

  const response = await request.get(`/report/my?${queryParams.toString()}`);

  const responseData = response.data?.message?.data || response.data;
  return responseData || { reports: [], total: 0 };
}

/**
 * 获取举报记录详情
 * @param reportId 举报记录 ID
 * @returns 举报记录详情
 */
export async function getReportDetail(reportId: string | number): Promise<any> {
  const response = await request.get(`/report/${reportId}`);

  const responseData = response.data?.message?.data || response.data;
  return responseData || null;
}

/**
 * 删除举报记录
 * @param reportId 举报记录 ID
 * @returns 删除结果
 */
export async function deleteReport(reportId: string | number): Promise<any> {
  const response = await request.delete(`/report/${reportId}`);

  const responseData = response.data?.message || response.data;
  return responseData;
}

/**
 * 管理员处理举报参数接口
 */
export interface ProcessReportParams {
  status: "pending" | "processing" | "resolved" | "rejected";
  adminNote?: string;
}

/**
 * 管理员处理举报响应接口
 */
export interface ProcessReportResponse {
  id: number;
  status: string;
  adminNote: string | null;
  processedAt: string | null;
  processedBy: number;
}

/**
 * 管理员处理举报记录
 * @param reportId 举报记录 ID
 * @param params 处理参数
 * @returns 处理结果
 */
export async function processReport(
  reportId: number,
  params: ProcessReportParams
): Promise<ProcessReportResponse> {
  const response = await request.put(`/report/${reportId}/process`, params);

  const responseData = response.data?.message?.data || response.data;
  return responseData as ProcessReportResponse;
}
