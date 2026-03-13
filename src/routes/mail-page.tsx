import { Cloud, Globe, Mail as MailIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Mail } from "@/app/mail/components/mail";
import { deleteMail, updateMail } from "@/app/mail/lib/actions";
import type { Account } from "@/app/mail/lib/data";
import { subscribeToMailsChanged } from "@/app/mail/lib/mail-events";
import { getMailFolderCounts, getMails } from "@/app/mail/lib/queries";
import type { Mail as MailType } from "@/db/schema";

const accounts: Account[] = [
  { label: "Alicia Koch", email: "alicia@example.com", icon: MailIcon },
  { label: "Alicia Koch", email: "alicia@gmail.com", icon: Globe },
  { label: "Alicia Koch", email: "alicia@icloud.com", icon: Cloud },
];

interface MailData {
  folderCounts: Record<string, number>;
  mails: MailType[];
}

const EMPTY_MAIL_DATA: MailData = {
  mails: [],
  folderCounts: {},
};

function useMailData(folder: string) {
  const [data, setData] = useState<MailData>(EMPTY_MAIL_DATA);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setData((current) => ({ ...current, mails: [] }));

    const [mails, folderCounts] = await Promise.all([
      getMails({ folder: folder as MailType["folder"] }),
      getMailFolderCounts(),
    ]);

    if (requestId !== requestIdRef.current) {
      return;
    }

    setData({ mails, folderCounts });
  }, [folder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return subscribeToMailsChanged(fetchData);
  }, [fetchData]);

  return data;
}

export function MailPage() {
  const [folder, setFolder] = useState("inbox");
  const data = useMailData(folder);

  const handleAction = useCallback(async (action: string, mailId: string) => {
    if (action === "reply" || action === "replyAll" || action === "forward") {
      toast.info("Compose actions are not implemented in this demo yet");
      return;
    }

    if (action === "snooze") {
      toast.info("Snooze is not implemented in this demo yet");
      return;
    }

    let error: string | null = null;

    switch (action) {
      case "archive":
        ({ error } = await updateMail({ id: mailId, folder: "archive" }));
        break;
      case "junk":
        ({ error } = await updateMail({ id: mailId, folder: "junk" }));
        break;
      case "trash":
        ({ error } = await updateMail({ id: mailId, folder: "trash" }));
        break;
      case "delete":
        ({ error } = await deleteMail({ id: mailId }));
        break;
      default:
        break;
    }

    if (error) {
      toast.error(error);
    }
  }, []);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
      <Mail
        accounts={accounts}
        currentFolder={folder}
        folderCounts={data.folderCounts}
        mails={data.mails}
        onAction={handleAction}
        onFolderChange={setFolder}
      />
    </div>
  );
}
