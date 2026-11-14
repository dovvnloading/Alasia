/* Optional Orren counter. A paid cart trip is one journey, regardless of load. */
(() => {
  "use strict";

  const opening = "Seventeen pigs come up from the lower sheds behind a woman rattling a spoon in an empty pail. The last sow has learned to lift the yard latch with her snout. Agnes shuts it again with her heel.\n\nAt the grain scales Meg, a Reedward thresher, counts coins onto her cart seat. Agnes lifts an ink pad to the footboard. The carter leaves her thumbprint on the sale slip. The six sacks on the cart have the landlord's red brand.";
  const pick = (id, label) => [id, label];
  const room = {
    yard: "The Pig Door", mill: "Corren’s mill", sale: "The afternoon price",
    quay: "Two loads of salvage", rush: "The rut below the ridge"
  };

  function start() {
    return {
      place: "yard", marks: false, book: false, sale: null, returned: false,
      hauled: 0, credit: 0, strap: false, ticket: false,
      bundles: 2, delivered: 0, dropped: false, clear: false, text: opening
    };
  }

  const freeCart = s => s.returned && s.sale === "covered";
  const strapPrice = s => s.returned && s.sale === "direct" ? 2 : 1;

  function options(s) {
    const o = [];
    switch (s.place) {
      case "mill":
        if (s.marks && !s.book) o.push(pick("book", "Show Corren where the two tide marks meet"));
        if (s.book && !s.sale) o.push(pick("direct", "Ask Corren to weigh the six sacks in public"));
        o.push(pick("yard", "Walk back to the Pig Door"));
        return o;
      case "sale":
        return [pick("return", "Come back to Reedward after the setting")];
      case "rush":
        if (s.strap) o.push(pick("release", "Pull the strap and dodge onto the dry bank"));
        return [...o, pick("shelter", "Set the load down and get behind the cart wheel")];
      case "quay":
        if (s.bundles && (s.ticket || freeCart(s))) o.push(pick("freight",
          s.bundles === 2 ? "Load both bundles onto Meg’s cart" : "Load the last bundle onto Meg’s cart"));
        if (s.bundles) o.push(pick("carry", "Shoulder one bundle for the ridge"));
        if (s.dropped) o.push(pick("recover", "Recover the bundle beside the cart rut"));
        return [...o, pick("yard", "Go back to Agnes’s yard")];
      default:
        if (!s.sale) {
          if (!s.marks) o.push(pick("turn", "Roll a barley sack towards the light"));
          o.push(pick("mill", "Visit the mill while the cart waits"));
        }
        if (s.hauled < 3) o.push(pick("work", "Carry a feed sack up the ridge for one mark"));
        if (!s.strap && s.credit >= strapPrice(s)) o.push(pick("strap",
          strapPrice(s) === 1 ? "Buy the release strap for one mark" : "Buy the release strap for two marks"));
        if (!s.ticket && !freeCart(s) && s.bundles && s.credit) o.push(pick("ticket", "Pay one mark for a cart journey"));
        if (s.delivered < 2) o.push(pick("quay", "Collect your salvage at the outer landing"));
        if (s.returned) o.push(pick("again", "Start the Reedward visit again"));
        if (!s.sale) {
          o.push(pick("covered", "Take the covered grain to Corren under Agnes’s name"));
          o.push(pick("pass", "Let the cart go without you"));
        }
        return o;
    }
  }

  function view(s) {
    const price = strapPrice(s);
    const ledger = [
      ["Your work marks", String(s.credit)],
      ["Release strap", s.strap ? "Fitted to your pack" : price + (price === 1 ? " mark" : " marks")],
      ["Cart", freeCart(s) ? "Agnes pays your fare" : s.ticket ? "Journey paid" : "1 mark per journey"],
      ["Salvage at the yard", s.delivered + " of 2 bundles"]
    ];
    if (s.returned && s.sale !== "direct") ledger.push(["Meg’s next load", "2 measures a sack to Agnes"]);
    if (s.sale) ledger.push(["Last sale", s.sale === "direct" ? "Meg signed · crew kept six more measures" : "Agnes signed · six measures to the yard"]);
    let clue = "";
    if (s.place === "mill") clue = s.book ? "Six crew names. The column headed Paid is empty." : "Corren keeps last season's threshing book under the meal chest.";
    if (s.place === "rush") clue = "The scout has lowered its foreplate. Its first rush will follow the cart rut.";
    if (s.place === "quay") clue = s.dropped ? "One bundle lies on the dry side of the rut." : "The cart can take both bundles. On foot, each needs a separate trip.";
    if (s.place === "yard" && !s.sale) clue = s.marks ? "Two salt lines meet on the same sack. The grain inside is dry." : "Each sack has a white tide mark. The side against the cart rail is out of sight.";
    return {
      title: room[s.place], scene: s.returned ? "Orren · After the setting" : "Orren · Second high",
      paragraphs: s.text.split("\n\n"), clue, ledger, actions: options(s)
    };
  }

  function act(s, id) {
    if (!options(s).some(([key]) => key === id)) return false;
    switch (id) {
      case "again":
        Object.assign(s, start());
        break;
      case "turn":
        s.marks = true;
        s.text = "A second salt line comes up from beneath the rail. At the seam the two meet in a V. Someone dipped one end of the sack and then the other. You ease the stitching apart. Dry barley runs over your thumb.\n\n“Meg. Get the cover over that,” says Agnes. Meg stays on her seat. “I gave you my print.”";
        break;
      case "mill":
        s.place = "mill";
        s.text = s.book ? "Corren has laid his brass weights on the open pay book to stop the pages lifting in the draught. The space on the purchase slip for the seller's name is still empty."
          : "Corren rests a hand on the meal chute to feel the stones turn above him. He has six empty bins. “Has she come up from the quay yet?”";
        break;
      case "book":
        s.book = true;
        s.text = "Corren digs a finger into the barley you carried in. “She got it wet all the way round this time.” He pulls the threshing book out from under the chest. Six names, six weeks' work at harvest. Nobody paid. The landlord took the farmer's grain for back rent and had the dry sacks branded. Anything the tide had spoiled he let the hands cart off.\n\n“Meg picked her six and backed the cart down the slip. Agnes puts her own name on the sale. Takes a measure out of every sack for that. You've seen the inside now. I'll weigh it up there if Meg will sign.”";
        break;
      case "direct":
        s.sale = "direct";
        s.place = "sale";
        s.text = "Corren sets his weights on the scales out in Agnes's yard. His thumb comes away red from the landlord's mark. Meg tips her advance back into Agnes's lap. Corren weighs out six more measures for the crew and holds the pen out to Meg. She asks what happens to the slip. “I have to keep my book,” he says. She signs.";
        break;
      case "covered":
      case "pass":
        s.sale = id;
        s.place = "sale";
        s.text = id === "covered" ? "You draw the cover over the red brands and walk the cart into the mill. Corren has cleared the place for weighing. Agnes scoops a level measure from each sack before he tips it. Six measures come back out with you. She rubs the ink from her thumb on the cart shaft. “If you've got gear wants moving, give Meg my name.”"
          : "You step down off the yard sill. Meg pulls the cover tight herself. The six sacks go on to the mill under Agnes's name. In the evening the thresher comes back with the cover and six full measures. Agnes empties them onto her dry floor.";
        break;
      case "return":
        s.returned = true;
        s.place = "yard";
        s.text = s.sale === "direct"
          ? "Meg is driving the pigs up the ridge for day pay. Her old place on the threshing crew went to the landlord's nephew. “He kept the slip. I've got the pay book. He's welcome to read them both.” Agnes has chalked a fresh price on the back straps. Two sacks' work."
          : s.sale === "covered" ? "The biggest sow has to turn sideways to get through the pig door. Agnes wants two measures a sack from Meg this time. Your loads, on her account, still travel free. Meg eyes the pail between her knees. “Drove past her door this morning. Got as far as the top before I turned round.”"
          : "Meg comes out of the yard counting money onto her seat. This time two scoops hang from each sack. She wraps the cover round her hands and tucks it tight under the load.";
        break;
      case "work":
        s.hauled++;
        s.credit++;
        s.text = [
          "Agnes leans the first sack against your back and waits for you to find your feet. At the top she takes the rope sling off you and scratches one work mark by your name.",
          "You bring the second sack up along the field bank. The sow has followed you the whole way. Agnes takes the sack from you over the door without letting her in.",
          "The binding round the last sack cuts a white line into your palm. Agnes stacks it with the other two and marks the board. The cart bed is empty."
        ][s.hauled - 1];
        break;
      case "strap":
        s.credit -= strapPrice(s);
        s.strap = true;
        s.text = "Agnes puts the pack on you and takes the weight in her hands. You pull the horn toggle. The strap slips through the ring and the bundle drops straight back into her arms. She threads it for you a second time. The toggle sits under your thumb.";
        break;
      case "ticket":
        s.credit--;
        s.ticket = true;
        s.text = "Meg winds a band of blue yarn round the near shaft. “Anything of yours at the outer landing, put it aboard. I'll bring it through to the yard.”";
        break;
      case "quay":
        s.place = "quay";
        s.text = s.dropped ? "You can see the last few feet of tarred binding over the lip of the cart rut. The shell has gone into the field ditch."
          : s.bundles === 1 ? "One bundle remains on the timber at the outer landing. The other is up in the yard."
          : "By the outer landing lie your two salvage bundles, a bronze fairlead and a dozen used deck rings tied through with cord. The tracks from the pig yard run right down to the timber they rest on.";
        break;
      case "freight": {
        const count = s.bundles;
        s.ticket = false;
        s.delivered += count;
        s.bundles = 0;
        s.place = "yard";
        s.text = count === 2 ? "Meg brings the pony right down to the timber. You stow the fairlead over the axle and put the deck rings at the tail to balance it. Both bundles come off at Agnes's door in one lift of the cart bed."
          : "You roll the remaining bundle up over the lowered tail. Meg takes it uphill at a walk and waits at Agnes's door for you to unload it.";
        break;
      }
      case "carry":
        s.bundles--;
        if (s.clear) {
          s.delivered++;
          s.place = "yard";
          s.text = "The scout's furrow ends in the field ditch. You carry the other bundle through and set it beside the yard door.";
        } else {
          s.place = "rush";
          s.text = "Halfway up, a bridleshell scout comes over the lip of the ditch and drops its head between the ruts. A snag in the binding holds the weight across your shoulders. An empty cart has been chocked at the bend.";
        }
        break;
      case "release":
        s.clear = true;
        s.delivered++;
        s.place = "yard";
        s.text = "Your thumb takes the horn toggle out as you dodge. The bundle falls in the rut. You get both boots onto the bank. The scout hits the bronze broadside and turns off through the field ditch. You lift the bundle off the scrape and walk it the rest of the way to Agnes's yard.";
        break;
      case "shelter":
        s.clear = true;
        s.dropped = true;
        s.place = "yard";
        s.text = "You roll the pack off a shoulder and duck behind the high cart wheel. The scout strikes the spokes and goes off through the ditch. There's room to get yourself uphill. The bundle stays below the bend until you make another trip for it.";
        break;
      case "recover":
        s.dropped = false;
        s.delivered++;
        s.place = "yard";
        s.text = "The scout has scratched a white half-moon in the iron tyre of the wheel. You bring the bundle out from under it, shoulder it against the bank and finish the climb.";
        break;
      case "yard":
        s.place = "yard";
        s.text = s.sale ? "Agnes has pulled her chair up to the scales. The last sow rubs one bristly flank up and down the door jamb."
          : "Meg's boot has polished a bright strip along the footboard. It goes on moving as you come up to the cart. Agnes has kept the gate open.";
        break;
    }
    return true;
  }

  const api = { start, view, act };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.PigDoor = api;
})();
