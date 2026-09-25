(function initializePcFooter() {
  "use strict";

  const config = {
    brand: {
      eyebrow: "Branded UK - Since 2001",
      title: "Workwear made personal.",
      intro: "Uniforms, embroidery and printing for teams across the UK - produced by specialists in Surbiton."
    },
    columns: [
      {
        title: "Shop",
        links: [
          ["All Products", "shop-pc.html"],
          ["T-Shirts & Polos", "tshirts.html"],
          ["Hoodies & Sweatshirts", "hoodies.html"],
          ["Jackets & Fleeces", "jackets.html"],
          ["Hi-Vis & Workwear", "hivis.html"],
          ["Headwear", "shop-pc.html?productType=caps"]
        ]
      },
      {
        title: "Customisation",
        links: [
          ["Embroidery", "services.html#embroidery"],
          ["Printing", "services.html#printing"],
          ["Artwork Guidelines", "blog/prepare-logo-printing-embroidery.html"],
          ["Logo Setup & Pricing", "customization.html"],
          ["How It Works", "customization.html"]
        ]
      },
      {
        title: "Help & Orders",
        links: [
          ["Track Your Order", "track-order.html"],
          ["Delivery & Lead Times", "services.html"],
          ["Returns", "terms-and-conditions.html#returns"],
          ["Size Guides", "shop-pc.html"],
          ["FAQs", "home-pc.html#faq"],
          ["Contact Us", "#contact", "contact"]
        ]
      },
      {
        title: "Business",
        links: [
          ["About Branded UK", "home-pc.html"],
          ["Bulk & Corporate Orders", "bulk-orders.html"],
          ["Request a Quote", "quote-form.html"],
          ["Case Studies", "blog/case-study-500-tshirts-london-event.html"],
          ["Sustainability", "services.html"],
          ["Blog", "blog/index.html"],
          ["Terms & Conditions", "terms-and-conditions.html"]
        ]
      }
    ],
    socials: [
      ["in", "LinkedIn", "https://www.linkedin.com/in/anderson-ricotta-92a394321/"],
      ["f", "Facebook", "https://www.facebook.com/profile.php?id=100083540654262"],
      ["ig", "Instagram", "https://www.instagram.com/brandeduk_workwear/"],
      ["yt", "YouTube", "https://www.youtube.com/@barudanamericainc3060"]
    ],
    payments: ["VISA", "MC", "AMEX", "APPLE PAY", "G PAY"]
  };

  function createLink(label, url, action) {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = url || "#";
    if (action) link.dataset.footerAction = action;
    return link;
  }

  function buildFooter(mount) {
    const frame = document.createElement("div");
    frame.className = "buk-footer-frame";
    frame.innerHTML = `
      <footer class="buk-footer" aria-label="Branded UK website footer">
        <div class="buk-footer__content">
          <div class="buk-footer__top">
            <div>
              <p class="buk-footer__eyebrow"></p>
              <h2 class="buk-footer__title"></h2>
              <p class="buk-footer__intro"></p>
            </div>
            <a class="buk-footer__cta" href="quote-form.html"><span>Request a quote</span><span aria-hidden="true">&nearr;</span></a>
          </div>
          <nav class="buk-footer__columns" aria-label="Footer navigation"></nav>
          <section class="buk-footer__contacts" aria-label="Contact information">
            <div><span class="buk-footer__label">Talk to us</span><a class="buk-footer__contact-link buk-footer__contact-link--accent" href="mailto:info@brandeduk.com">info@brandeduk.com &nearr;</a></div>
            <div><span class="buk-footer__label">Call or WhatsApp</span><a class="buk-footer__contact-link" href="tel:+442089742722">0208 974 2722 - 0744 7348 564</a></div>
            <div><span class="buk-footer__label">Opening hours</span><p class="buk-footer__contact-text">Monday-Friday - 9:00-18:00</p></div>
          </section>
          <div class="buk-footer__bottom">
            <div class="buk-footer__company"></div>
            <nav class="buk-footer__policies" aria-label="Legal policies"></nav>
            <nav class="buk-footer__socials" aria-label="Social media"></nav>
          </div>
          <div class="buk-footer__payments" aria-label="Accepted payment methods"></div>
        </div>
        <div class="buk-footer__watermark" aria-hidden="true"><span>branded</span><span class="buk-footer__watermark-uk">uk</span></div>
      </footer>`;

    frame.querySelector(".buk-footer__eyebrow").textContent = config.brand.eyebrow;
    frame.querySelector(".buk-footer__title").textContent = config.brand.title;
    frame.querySelector(".buk-footer__intro").textContent = config.brand.intro;

    const columnsRoot = frame.querySelector(".buk-footer__columns");
    config.columns.forEach((column) => {
      const section = document.createElement("section");
      section.className = "buk-footer__column";
      const heading = document.createElement("h3");
      heading.textContent = column.title;
      const list = document.createElement("ul");
      column.links.forEach(([label, url, action]) => {
        const item = document.createElement("li");
        item.appendChild(createLink(label, url, action));
        list.appendChild(item);
      });
      section.append(heading, list);
      columnsRoot.appendChild(section);
    });

    const company = frame.querySelector(".buk-footer__company");
    company.append(
      document.createTextNode(`\u00a9 ${new Date().getFullYear()} Branded Europe Ltd trading as Branded UK`),
      document.createElement("br"),
      document.createTextNode("Company No. 09472407 - VAT No. 218 2736 09")
    );

    const policies = frame.querySelector(".buk-footer__policies");
    policies.append(
      createLink("Terms & Conditions", "terms-and-conditions.html"),
      createLink("Privacy Policy", "#privacy"),
      createLink("Cookie Policy", "#cookies")
    );

    const socials = frame.querySelector(".buk-footer__socials");
    config.socials.forEach(([label, name, url]) => {
      const link = createLink(label, url);
      link.setAttribute("aria-label", name);
      link.target = "_blank";
      link.rel = "noopener";
      socials.appendChild(link);
    });

    const payments = frame.querySelector(".buk-footer__payments");
    config.payments.forEach((payment) => {
      const badge = document.createElement("span");
      badge.className = "buk-footer__payment";
      badge.textContent = payment;
      payments.appendChild(badge);
    });

    frame.addEventListener("click", (event) => {
      const contactLink = event.target.closest('[data-footer-action="contact"]');
      if (!contactLink) return;
      event.preventDefault();
      if (typeof window.openContactPopup === "function") window.openContactPopup();
    });

    mount.replaceChildren(frame);
  }

  function initialize() {
    document.querySelectorAll("[data-pc-footer]").forEach(buildFooter);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
