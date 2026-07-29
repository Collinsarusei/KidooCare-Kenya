const fs = require('fs');
const path = require('path');
const https = require('https');

const screens = [
  {
    id: "781606d8e3c143d5b41caa6b05408817",
    filePrefix: "01_school_profile",
    title: "School Profile",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLs8Gm9VNTPI3KO1btshN8n0LWI__4RYmeQWbqsVGudsIPEbVi9tBaiw58toHH66lBtva8uNykfAxDIs67zW28Jm5cH3bbVheTR7UQsE30IO7OpGFOgIbhz-Q7t2YL8_L53yGgjc6t6xo1hUhUfOLh9bFUhAbMXVwhBnfqDuAWDsA5EkeU7U3T-jdMxkahfD-JmC6jHrgEqmkcslAJyOuDaAOE5J1DIejTwyCUb53bWtHqEurUvpVZy-UnM",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU3OGMyNzhmMDQzMjQzZTZiMDYwNjc0YzVjYjM1Nzk5EgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "a059bf63ece740399e863dfbc72223a9",
    filePrefix: "02_signup_login",
    title: "Sign Up / Login",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLs72wQdUsX2iguBg0VzJgffmpKxfHa-birCWV5HAspFfUKoXB2HrWtP6vSZFPWfgY6oXPqVGb6wqoIJj7coQs1nkWpTtv89NFZ6rKzH2ZlyIBdmBATa0kdTv_gkgy8DbsqFTgFHqNWpsCpGg25CZqhrc7HUSjyx-xBR1bAraY5BxR0ONAM3ymKDT8yK1oncseHb73PqDtTgAEIWc6MAAzrhabEWHjaBPcCbdLxUsyTHUaxcrrNl9GmAZXbE",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzZhMGE2YWUzOGEwNWZkYTYxZThjMjI4ZTZkEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "7ebbdcd8320240c3809f9b73477db708",
    filePrefix: "03_browse_schools",
    title: "Browse Schools",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLtJzetWqou4tO28i-bt355JKrJF4l46CidH2bANTih2NsZT22yOjhdaCxsym5RJWjktce8252iusZcYPc0fRGOBnOm2U6XHO-aYfeextS8rkHAHnfbC-G-F2IgHIf989zC-wcTu5fTLLknT3AURKu_bW4IUi6FfKx-C8rZY_nxstcR_2OBENwnMRZKe7Qm4RCWk0pVgXGV_wgOMEdMW8sKD4O7W19VnK3W6m1Vhf7ll7Hjd2wYX7cGA2U8",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI2ZGExZTRiMmRhMjQxZDA5MDYyYWRiM3E4MTExNjg0EgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "013d014f05da4e48928c29f6a79ab6f9",
    filePrefix: "04_my_children_dashboard",
    title: "My Children Dashboard",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLudU5M754QPpdbyQs6gBhwNpOU-YyvDFnu1_o-s6XQrQxMxX1fD4DUyrdKIKZ-yKWn3N1VnhyBRouttd7VZhrk0mx8vxkUZgr2OmT11FQgMf7BHGsyEoSVkIM6xHDFw__kgwBUOT4Ee463PUAhMecF7MTX8nHb78c2Zpr5ZcrWiMOrZ-PzDJUhr6Bg7NjMF0B87DZHq5f6pBPWTZwUCNc3XmfM2UDlPCsldRA9rmQugyLlkfLYXFCZOcxE",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ExZmUyYzhmZjljNjQwZGE5M2ZjZTU1MmUwYTZiODgwEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "8f2022681b5541748cdf2c430b5aa932",
    filePrefix: "05_payment_and_progress",
    title: "Payment & Progress",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLsOJhMSg0te6WS9KVm0fNOnk9rqrKJfyvzoQv0gfUFHXN9o32-bW3NIL4-muF8DtMY12F-akEQ1yHsMAQoSr_NPXwa33OVUj-5AuYPW6IisHKHBd9OAvkdLWQFzmproiSK3QnqDJoHV-2VIfuA2fgXHeGvH8ctI7rXmwXPVojWzZF-ptM7gL2df4w037dHtv1DkJEcutuR33djFYElF55PdFlqdV-PoPI8grozuUa07wNC9h5Kqk1iURE1X",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU0MmY5ZmE5MWNhNTQ4ZWViMDQ5NjBiMTUyNjNkOTQ3EgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "cada2cd936a24a5b9144be6d68101c92",
    filePrefix: "06_school_reviews",
    title: "School Reviews",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLu2cYVzQWRE6gvu1dB2AQ8ymJeiLWXgEcAa8T0P1FmORkFxHHtSQJhOPCXrYFtNYo2n8AirhV2vjAH5oJ_I2mSp2LqX2fkQ11uXnsWbjPQvXuKbJr50sDGpc_shmPxHWz1HWU7DS_n4rHbOVMKkp6lcvnREqb02fd95dFwqTvraZex0MbI0vfq-NSa8XKvYyuHDB2JwNZt91pkMQ7txNiwNYI39yj3xpbdBVLb3wq2hTpOHhiBRM5pPChTm",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzkzYmEzY2U5ZTdlMzQ5MTk4MzNiYjBjOGM0Y2FmNTkzEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "fa53a8c65c11499b800ab29232882f36",
    filePrefix: "07_enrollment_and_intake",
    title: "Enrollment & Intake",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvlaOO-a2RaCqrmOPsyMQkkjbgwvChg7YfxOlNOJsYYR-GuyjzSQSrILIIwhQDXjjkoet5rjSJFkX3SoqkqyO9JPMQqAyrfwgI0iBYqLPf5sj8Ez_zsT8modSu_nnAm0k4JtrW9N6hf53KUCCxr-n8tzPzfocVRxibZ-cX0akdDYJC4x6hcEi-QMKRgTh7YEGPtTRKW4w9FEdnmir8XvqUzM30fm0ANBp49j2Pcqfrx3bxL6HvfNObQSIVh",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U3MzUwMTY1NTNiYzQ1ZGZiMWY5ZWE1NDFmNTIyMmZkEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "131c6c584a9c4dce893d5c28ddcea099",
    filePrefix: "08_school_onboarding",
    title: "School Onboarding",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLsMScjs6PR75euHSeg_y7U6YMR09EnRtcaiyen-H-ZUUXP521Em1isZofuzfZOrUHuiSbqMRi_JsYAYv2UbE7y7VvzrhXtODVs4hC6iGx9KW34_FMFGJWv2uxJG_3mMLfY3j2C_fACESX5RFOHXOoyR70r2gX6Kk89u9YLy-LhuGMRUhamhbSChD_RWR3r3ibkQ9l-pdqDkO3bMEL3_Pu1BwAkySqbhfRsB7Hxyeq9j0gaOg-LTjRAljrQE",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2MwMzQzNWQ4MGJkMjRmMDFiN2U1ZWQ3NjZmNzkwMjZlEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "b1ec8123ccc1484098d5066c890468b2",
    filePrefix: "09_school_dashboard",
    title: "School Dashboard",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvdfken5cseoG8f7XLNSpKFftPb02ZoeAwKv3uy7U_BJBvlXtn7VTZmljDVs9WbrO4120ygicKvazIgtlvP224DF_GzrJHV4H2mcAlEEfoAfUyO53noQS5sBArSMJf7sBDWlYBbF4CalTqKio7YP2Mnqy7rEi7bZN9rLOWUr4HUPxFWsCgpf8Y0qQmar8ILGT0yvW-fDMAQILWOSmqY72AhbAgZ4nqV9WX2TpXWDL5e9UcxSWhCPYKKMzI",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ2NWQ4NDNmMmRmMDQ2ZDA4MTQ3MDE5YTE2ZWU2MmE0EgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "49e4090759d3499a93d3f7b313cf9cee",
    filePrefix: "10_admin_dashboard",
    title: "Admin Dashboard",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuKOsMvqbBXRbmgLyH-9ZEwrwMBhznIeB4ps0HxAyise3ygOnHI2cM38YVzQOck5QqMvQs67GyGZVfGycV3niFXzYc8GI5QgDWZVQUrg2jMUUcxHLOcmtf0ZsLXMJKVGUhakQOB12lf1-7ec7F-p9aV6jf-YkwAf6cLvEPk8t59oPpcdKQ780Y1sJfPgQzl1WQlOE0j0zdfk2c36ne-bFaDTu0HWr2w6opc0XFTV0XMCsnjA8KYb7HIEWRB",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzE4OWIyYjU0YTFhNTQ2OGQ4NmQxYjk1NTRhYjBiMWRiEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "734e2c5d697a4399ae442dd63b78e2d1",
    filePrefix: "11_dispute_management",
    title: "Dispute Management",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvJPD8RBvbuEzhgcC0t_BXqaCh1yjgNVDkAXncSYxabR7Ys8kHx8aIf9VmvWBqiXT4dB5wmJ2pefqwxXc8BW-SQ3WaReaDMcubtm9YpnzBRTUPj_islTwZ_Kn_jZZkUbT29ebkcXW2NbaTheGHVLg1KnhERSWadjcnRXWYz_zQBfHlARKUi0AWCFSN86F1s6MNNXgzGfD581GLXmb0kVk16wD9X83nlXP04ANlWVXDUdPBY7Z2XeaoltIUt",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA2ZTJiYmIzZTcyYzQ0YmZhNGJhOGNkYTBlNGRjYjU2EgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "a07e82e31ba242d4a91a5e5c63b3404a",
    filePrefix: "12_services_management",
    title: "Services Management",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLsCe8mgzuHJSJH0f3WUdFu-0I8bCSM4uhj88aOm34Ula75Wru1QcD9HvSbipiic0vCackEzqkrkxoQ7Sy1qi-wbTjtZ5OWxKXYMZ_Yv_SSH8n7cJRh3jXJ6PICsnUHien3GVT1Re6f7HkYp7PYHy7K8VvqCkq8TtLDS6kKES5k9bVLOLlpwvOCDo93_fYcBoFAKyio09erDnfYKI4sSdXqvV72Jc_8vausMWL-iL0Bpmobsn5I5m4FjG6hy",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZkYWNlMmY1ZTQzMTRlMjk4MDIwYjVjMWMyMjQxMTUwEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "dc476fd66b714fe7b0c8b94959564cbb",
    filePrefix: "13_verifications_and_docs",
    title: "Verifications & Docs",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuVpGgYea_Lq119SVqsTTW9MNltcyRGxS1A76ZpScFHclgHchNwz_vth_oyvIbX3DLSzdqesiUzoRqvgZrE0gVt_VWXN8SJT7u28OrQea9za1PuWwl3tiiUMwXVk1AxU5UXqNfzMI_g2zdH-5fRKlDM7OkN-KeFcQUPAJ-1KMAns67zhCHUUM8rEt-eetnzlTarT-tle5Vc3hXfwwKyEY45xSxeILiwmJg40eCyT2QNSVNdaf5NR7Oag-WO",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2E2M2JhNzgzMDc1YTQ4NzNiNTM1OThmYjU3ZDAwZDVjEgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  },
  {
    id: "214c5e016df043f485344c741d633db1",
    filePrefix: "14_add_new_school_admin",
    title: "Add New School (Admin)",
    screenshotUrl: "https://lh3.googleusercontent.com/aida/AP1WRLtEbzdjquBuZ_CFCOYehwmTCJZUBDHlVDQ1uQHDBE7KRinNC0BdgAeFYBNdUuMq6sVuEtq5qK7LQxYjqL5D6-8U0AmSCNshQMZuaUfx39mBA2ZR7mPTGxaeebcXcacZaUzvkrrGO_57DZX1cZfZhdw9mUyfsQRQjeUw3QNEJs4DzfOt3rsdov_F4U73t0x9lfO5zmQituak7yQEIU7KssemuUF3lrdB9-O9tIHHLLWTiwK_4WQAumxpvQ7n",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzhmODMxMTk0YmUwMjRjNmVhMjQ2N2U1NWI1MTNjYmM2EgsSBxDW6OfuvxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjkzNTk3OTIwODI3NjAxNDA2NA&filename=&opi=89354086"
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = (u) => {
      https.get(u, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location);
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        } else {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`Failed with status ${response.statusCode} for ${u}`));
        }
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function main() {
  const dir = __dirname;
  console.log("Starting downloads...");
  for (const s of screens) {
    const imgPath = path.join(dir, `${s.filePrefix}.png`);
    const htmlPath = path.join(dir, `${s.filePrefix}.html`);
    
    console.log(`Downloading ${s.title}...`);
    try {
      if (s.screenshotUrl) {
        await downloadFile(s.screenshotUrl, imgPath);
      }
      if (s.htmlUrl) {
        await downloadFile(s.htmlUrl, htmlPath);
      }
      console.log(`Successfully downloaded ${s.title}`);
    } catch (e) {
      console.error(`Error downloading ${s.title}:`, e.message);
    }
  }
  console.log("All done!");
}

main();
