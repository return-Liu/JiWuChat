import { describe, expect, it } from "vitest";
import { formatMessageContent, isMessageExists } from "../../untils/contactManager";

describe("formatMessageContent", () => {
    it("normalizes call message content when the payload is an object", () => {
        expect(
            formatMessageContent(
                "call",
                { text: "通话 00:12", callType: "voice" } as any,
                false,
            ),
        ).toBe("通话 00:12");
    });

    it("normalizes file message content when a structured payload is provided", () => {
        expect(
            formatMessageContent(
                "file",
                { name: "report.pdf", size: 10240 } as any,
                false,
            ),
        ).toBe("[文件]");
    });

    it("keeps separate system cards when two messages share the same content payload", () => {
        const existingMessages = [
            {
                id: 101,
                content: '{"type":"group_notification","groupName":"测试群"}',
                messageType: "group_notification",
                _timestamp: 1,
            },
        ];

        const incomingMessage = {
            id: 102,
            content: '{"type":"group_notification","groupName":"测试群"}',
            messageType: "group_notification",
            _timestamp: 2,
        };

        expect(isMessageExists(existingMessages, incomingMessage)).toBe(false);
    });
});
