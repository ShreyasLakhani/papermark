import { Unsend } from "unsend";

import prisma from "@/lib/prisma";

const unsend = new Unsend(
  process.env.UNSEND_API_KEY,
  process.env.UNSEND_BASE_URL,
);

const contactBookId = process.env.UNSEND_CONTACT_BOOK_ID as string;

const subscribe = async (email: string) => {
  if (!contactBookId) {
    console.error("UNSEND_CONTACT_BOOK_ID is not set in the .env. Skipping.");
    return;
  }

  const contactId = await unsend.contacts.create(contactBookId, {
    email,
  });

  if (!contactId.data?.contactId) {
    throw new Error("Failed to add user to contact book");
  }

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      contactId: contactId.data.contactId,
    },
  });
};

const unsubscribe = async (email: string): Promise<void> => {
  if (!contactBookId) {
    console.error("UNSEND_CONTACT_BOOK_ID is not set in the .env. Skipping.");
    return;
  }

  if (!email || email === "") {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { contactId: true },
  });

  if (!user?.contactId) {
    return;
  }

  await unsend.contacts.update(contactBookId, user.contactId, {
    subscribed: false,
  });
};

export default unsend;
export { subscribe, unsubscribe };
