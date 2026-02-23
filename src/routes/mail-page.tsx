import { Cloud, Globe, Mail as MailIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  mails: MailType[];
  folderCounts: Record<string, number>;
}

const EMPTY_MAIL_DATA: MailData = {
  mails: [],
  folderCounts: {},
};

function useMailData(folder: string) {
  const [data, setData] = useState<MailData>(EMPTY_MAIL_DATA);

  const fetchData = useCallback(async () => {
    const [mails, folderCounts] = await Promise.all([
      getMails({ folder: folder as MailType["folder"] }),
      getMailFolderCounts(),
    ]);
    setData({ mails, folderCounts });
  }, [folder]);

  useEffect(() => {
    let stale = false;
    const run = async () => {
      await fetchData();
    };
    if (!stale) {
      run();
    }
    return () => {
      stale = true;
    };
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
    switch (action) {
      case "archive":
        await updateMail({ id: mailId, folder: "archive" });
        break;
      case "junk":
        await updateMail({ id: mailId, folder: "junk" });
        break;
      case "trash":
        await updateMail({ id: mailId, folder: "trash" });
        break;
      case "delete":
        await deleteMail({ id: mailId });
        break;
      default:
        break;
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
