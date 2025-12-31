import fetch from "node-fetch";

const githubRepoRegex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;

let handler = async (m, { conn, args, command }) => {
  let repoUrl;

  if (!args[0]) {
    // Default repo fallback
    repoUrl = "https://github.com/Sylivanu/unicorn-md";
  } else {
    if (!githubRepoRegex.test(args[0])) {
      throw "⚠️ *Invalid GitHub link.* Please provide a valid repo URL.";
    }
    repoUrl = args[0];
  }

  let [, owner, repo] = repoUrl.match(githubRepoRegex) || [];
  repo = repo.replace(/.git$/, '');

  const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;
  const headRes = await fetch(zipUrl, { method: "HEAD" });
  const fileName = headRes.headers.get("content-disposition")?.match(/attachment; filename=(.*)/)?.[1];

  if (!fileName) throw "❌ Could not retrieve file. Please try again later.";

  await m.reply("🦄 *Fetching your Unicorn GitHub repository... Please wait a moment!*");

  await conn.sendFile(m.chat, zipUrl, fileName, null, m);
};

handler.help = ['gitp <github-url>'];
handler.tags = ['downloader'];
handler.command = /^gitp|gitunicorn$/i;

export default handler;
