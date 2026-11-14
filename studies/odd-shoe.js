/* An optional fourth-high visit to the ridge stair. Stock and family business
   are independent. The counter pays once for a fitting, in goods. */
(() => {
  "use strict";

  const opening = "Ruth sits in the shop window with one stockinged foot on a biscuit tin. She has painted a boot on it. Six black eyelets. A lick of bare wool where daylight ought to show under the bow. When she wriggles her big toe the leather appears to breathe.\n\nNell the cobbler looks up from a boot on her knee. “My sister's put that in my window to frighten off the custom.”\n\n“Somebody's got to show them your cheap work.” Ruth holds out her foot to dry. Behind her hang two red shoes, each with a row of open buttons.";

  function enter(state) {
    state.shop = { place: "counter", fit: "open", purchase: null, stocking: false, order: null };
    state.text = opening;
    state.phase = "shop";
  }

  function counterText(shop) {
    if (shop.order === "stairs") return "The biscuit tin has a dent in the lid from Ruth's heel. Through the window you can see her about two steps below the window itself. There's a pea under one of the red buttons. Nell squints down at it. “What has she brought me now?”";
    if (shop.order === "window") return "Two red crescents show under the window curtain. Ruth has claimed the stool on the shop side. When a woman asks how much the red pair costs, Ruth stretches out her legs. “These are spoken for. You can try for my stockings.”";
    return "Ruth has been keeping count of the people who look twice at her painted foot. Nell has been keeping count of the people who look in and keep walking. They disagree by two.";
  }

  const option = (id, label) => ({ id, label });

  function choices(state) {
    const shop = state.shop;
    switch (shop.place) {
      case "fitting":
        return [option("square", "Bring the broad, square-toed left"),
          option("cut", "Bring the narrow left with a slit down the side"),
          option("counter", "Go back to the counter")];
      case "ruth": {
        const options = [option("buttons", "Ask Ruth why she ordered the red shoes")];
        if (!shop.stocking) options.push(option("stocking", "Offer her a rag for the wet stocking"));
        options.push(option("counter", "Go back to Nell"));
        return options;
      }
      case "order": {
        const options = [option("stairs", "Take Ruth down the stair in the red shoes"),
          option("window", "Stay and dress the foot in Nell’s window")];
        if (shop.stocking) options.push(option("witness", "Ask who saw through the painted boots"));
        options.push(option("counter", "Give the sisters a moment"));
        return options;
      }
      case "outside":
        return [option("counter", "Step back into the shop"), option("restart", "Start the Sere crossing")];
      default: {
        const options = [];
        if (shop.fit === "open") options.push(option("fit", "Earn a mend by fitting an odd shoe"));
        if (shop.fit === "owed") options.push(option("heel", "Spend the fitting fee on a heel lining"),
          option("cord", "Spend the fitting fee on a pair of waxed laces"));
        if (!shop.order) options.push(option("ruth", "Pull a stool up beside Ruth"));
        options.push(option("outside", "Step out onto the ridge stair"));
        return options;
      }
    }
  }

  function act(state, id) {
    const shop = state.shop;
    switch (id) {
      case "counter":
        shop.place = "counter";
        state.text = counterText(shop);
        break;
      case "fit":
        shop.place = "fitting";
        state.text = "A carrier takes off his left boot. He's cut the side open where his smallest toe crosses the next one. Every sack he carries pushes that toe up into the roof of the boot. Nell takes the foot on her knee and measures it under his weight.\n\n“Bring me a left that'll let these two lie down. I'll mend your heel or give you a pair of laces for the trouble. Whichever you fancy.”";
        break;
      case "cut":
        state.text = "The slit gapes when he stands. The seam under it still presses a white line into the old scar across his little toe. He takes the boot off himself. “I can cut a hole in the one I've got. Show me the wide one.”";
        break;
      case "square":
        shop.fit = "owed";
        shop.place = "counter";
        state.text = "With the square toe on, the carrier stands and spreads his toes. He does it again. He leaves wearing a brown left boot and a black right. Nell ties his old left to her chair to remind herself what he paid in part exchange.\n\n“One heel lining or two laces. Pick while I can still see to thread a needle.”";
        break;
      case "heel":
        shop.fit = "paid";
        shop.purchase = id;
        state.text = "Nell eases the back of your boot away from its lining. Under the old seam is a little hard roll of your own stocking, worked in over miles. She puts it in your palm and closes the new leather over the seam. The pull at your heel is gone when you stand.";
        break;
      case "cord":
        shop.fit = "paid";
        shop.purchase = id;
        state.text = "Nell threads the waxed laces into your boots and cuts them to your reach with your knee bent. “Now show me you can get them off.” The knots come free in one pull. She winds the old laces round your fingers. “There's another year's work in those.” A carrier brings in his basket with one handle split. You bind it with the old laces while Nell knots off her thread.";
        break;
      case "ruth":
        shop.place = "ruth";
        state.text = "“We buried our dad in a beautiful pair of black lace-ups,” says Ruth. “I did the left and Nell did the right. She gave him seven eyelets. I gave him six.”\n\nNell keeps stitching. “You were counting the hole in his stocking.”\n\nRuth dips the brush again. “Well. He'd have felt a draught if he'd lived.”";
        break;
      case "stocking":
        shop.stocking = true;
        state.text = "Ruth rolls the rag to a point and cleans the black from between two toes. “As soon as he went cold I took his boots down to a man in the sail loft. Good calf. Enough to pay the last of what we owed for the piece of ground next to Mum. I asked him to wait till after the viewing. He had a boat to catch.”\n\nShe puts the stopper in the blacking. “Nell kept getting up that night to see if it had run. She was ten.”";
        break;
      case "buttons":
        shop.place = "order";
        state.text = "“Six Sundays I did the laying-out for people off Sere. Plenty of black feet passed through these hands. I put a little by each time. Been saving for an indecent pair of shoes ever since.” Ruth taps the red kid. “When it's my turn they'll have to get those buttons undone if they want the shoes off me. In the meantime I'll have the wear.”\n\nNell buttons them over fresh stockings. She sets a wooden foot in the window and pulls a clean white stocking over it. A woman outside has waited through the whole fitting with a stoppered jar in her lap. Now she stands. “Give us your arm down the steps,” says Ruth. Nell holds up the brush. “Or stay. This lady wants showing how it's done.”";
        break;
      case "witness":
        state.text = "“The man who laid him in the ground. He came round after and asked would we do his wife the same. He had two girls with feet her size. I've still got the jar he brought.” Ruth nods at the woman waiting outside. “That's her own jar. There's always somebody with a jar.”\n\nNell has set the wooden foot ready. Ruth puts a red toe over the sill to see it in the daylight.";
        break;
      case "stairs":
        shop.order = "stairs";
        shop.place = "counter";
        state.text = "Ruth lets you take her elbow on the way down. At the first turn she lifts her skirts clear of her ankles. Across the wall the hoist hangs idle. A man shelling peas on a doorstep gives a long, appreciative whistle. It's pitched for a girl of seventeen. Ruth gives him one back that makes him spill the peas.\n\n" +
          (shop.purchase === "heel" ? "You take the whole flight beside her without the seam catching your heel. " : "") +
          "On the way back Ruth picks a pea off the tread and slips it under the strap on her right shoe. “A keepsake for my sister.” In the shop window the wooden foot has gone black. The woman with the jar is halfway home.";
        break;
      case "window":
        shop.order = "window";
        shop.place = "counter";
        state.text = "The woman puts her jar beside the wooden foot. “He wore buckles. Can you do buckles?” Nell gives you the brush to lay in the black while she cuts a little square out of the bright lining of a tea packet. The woman makes you move it twice. “There. He had one ankle bigger.” She tries it herself on the other side.\n\nWhen Ruth comes back, there's grit on the red toes. She gives her sister one foot at a time to wipe. “Did you get a whistle?” Nell asks. “Several,” says Ruth. Nell has been sitting by the open window the whole time. She lets her have several.";
        break;
      case "outside":
        shop.place = "outside";
        state.text = shop.order ? "At the landing below, Ruth's red shoes have left two rows of little dots in the dry flour blown off a cart. A child is trying to walk in them." : "From the ridge stair you can see Ruth's painted foot sticking out into the afternoon. Somebody has stopped on the step below to draw it.";
        if (shop.purchase === "cord") state.text += " The carrier's basket goes past with a pair of old bootlaces wound round the handle. The splice is holding.";
        break;
    }
  }

  function view(state) {
    const shop = state.shop;
    const headings = { counter: "The Odd Shoe", fitting: "A left for a left", ruth: "Six eyelets", order: "The red pair", outside: "Below the window" };
    const items = [
      { title: "Heel lining", lines: ["Soft side to the stocking. One fitting buys a lining, sewn while you wait."] },
      { title: "Waxed laces", lines: ["Sold in pairs, cut on the foot. One fitting buys both."] }
    ];
    if (shop.place === "fitting") items.splice(0, items.length,
      { title: "Broad left", lines: ["Square toe box. The carrier’s two outer toes lie inside the chalk outline with room to spare."] },
      { title: "Slit left", lines: ["Narrow last. The slit gives extra height over a toe that has already folded up."] });
    else if (shop.fit !== "open") items.push({ title: "Nell’s work slate", lines: [
      shop.fit === "owed" ? "Fitted a carrier. One mend owing." : "Paid in full · " + (shop.purchase === "heel" ? "Heel lined." : "Two waxed laces fitted.")
    ] });
    if (shop.order) items.push({ title: "Red kid, buttoned", lines: ["Six buttons to a side. Ruth took the pair out on her feet."] });
    return { heading: headings[shop.place], location: "Verran · Ridge stair · Fourth high",
      shelfTitle: shop.place === "fitting" ? "Under the fitting bench" : "Nell’s counter", items,
      actionTitle: shop.place === "outside" ? "From the stair" : "At the Odd Shoe" };
  }

  window.OddShoe = { enter, choices, act, view };
})();
