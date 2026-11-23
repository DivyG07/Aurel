import Script from "next/script";

/**
 * Zapier Chatbots embed (floating bubble). Create a chatbot at https://interfaces.zapier.com,
 * then set NEXT_PUBLIC_ZAPIER_CHATBOT_ID to its embed ID. Renders nothing until configured.
 */
export function ZapierChatbot() {
  const id = process.env.NEXT_PUBLIC_ZAPIER_CHATBOT_ID;
  if (!id || !/^[\w-]+$/.test(id)) return null;
  return (
    <>
      <Script type="module" src="https://interfaces.zapier.com/assets/web-components/zapier-interfaces/zapier-interfaces.esm.js" strategy="afterInteractive" />
      <div dangerouslySetInnerHTML={{ __html: `<zapier-interfaces-chatbot-embed is-popup="true" chatbot-id="${id}"></zapier-interfaces-chatbot-embed>` }} />
    </>
  );
}
