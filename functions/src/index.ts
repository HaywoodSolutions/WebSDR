import * as functions from "firebase-functions";
import * as axios from "axios";

const cleanup = (text: string): any[] => {
  const chunks = text.split(/(<div class="cl-info">)|(<span class="cl-name">)/);
  console.log(typeof text, chunks.length)
  return chunks.reduce((l: string[], v, i) => {
    if (i % 2 == 1) {
      l.push(v);
    }
    return l;
  }, []).map((v) => {
    const o: Record<string, any> = {};
    const str = v.replace(/(<!-- )|( -->)|()/g, "");
    str.split(/\n/).map((v) => {
      const [key, value] = v.split("=");
      switch (key) {
        case "users":
        case "users_max":
        case "avatar_ctime":
        case "gps_good":
        case "fixes":
        case "fixes_min":
        case "fixes_hour":
        case "tdoa_ch":
        case "asl":
          o[key] = parseInt(value);
          break;
        case "freq_offset":
          o[key] = parseFloat(value);
          break;
        case "gps":
          o[key] = value.slice(1, value.length - 1).split(", ");
          break;
        case "offline":
          o[key] = value !== "no";
          break;
        case "snr":
          o[key] = value.split(",");
          break;
        case "updated":
          o[key] = new Date(value.split(",")[1]);
          break;
        case "bands":
          o[key] = value.split("-").map((v) => parseInt(v));
          break;
        default:
          o[key] = value;
          break;
      }
    });
    return o;
  });
};

export const checkKiwiSDR =
  functions.pubsub.schedule("every 15 minutes").onRun(async () => {
    return axios.get("http://kiwisdr.com/public/")
      .then((res) => res.data)
      .then((text: string) => {
        const data = cleanup(text);
        console.log(data[0]);
      });
  });

export const date = functions.https.onRequest(async (req, res) => {
  const { data } = await axios.get("http://kiwisdr.com/public/")
  res.send(cleanup(data));
});