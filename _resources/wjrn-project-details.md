# Project WJRN: Jacewon Internet Radio Network Master Context

## 1. Project Overview
[cite_start]The Jacewon Internet Radio Network (WJRN) is a self-hosted, independent digital broadcast tower[cite: 1]. [cite_start]The platform is designed to broadcast full, unedited archival recordings of Jacewon's Twitch shows on demand and on a scheduled rotation[cite: 1, 6]. [cite_start]These broadcasts keep all original host commentary, fun facts, and audience interaction intact[cite: 6]. [cite_start]Listeners tune in via embedded HTML5 players on custom websites (like jacewonmusic.com and therockgarden.tv) with nothing to download[cite: 7].

---

## 2. Infrastructure & Deployment History
[cite_start]The platform runs on an enterprise-grade containerized orchestration suite using AzuraCast[cite: 547]. 

* [cite_start]**The Pivot:** Initially attempted on a DreamHost Managed VPS, but Docker's requirement for root/sudo access to map network bridges and volumes hit a hard brick wall due to DreamHost's strict managed security policies[cite: 8, 367, 368, 555, 556].
* [cite_start]**The Hardware:** Successfully deployed on an unmanaged DreamHost **DreamCompute** instance running Ubuntu Linux with at least 2GB of RAM[cite: 373, 591, 592]. 
* [cite_start]**The Connection:** Secured via a locally generated Mac SSH key (`new_radio_key`) mapped to the DreamCompute control panel to bypass password restrictions[cite: 678, 679, 696, 697]. [cite_start]Server IP: `208.113.165.231`[cite: 782].
* [cite_start]**The Software Stack:** AzuraCast installed natively inside Docker[cite: 8, 787]. [cite_start]The stack utilizes Icecast (Broadcasting Service), Liquidsoap (AutoDJ), MariaDB, and Nginx[cite: 526, 527, 528, 529].
* [cite_start]**Domain & Security:** The network is hosted securely on a custom subdomain: `https://radio.jacewonmusic.com`[cite: 886, 888]. [cite_start]It is protected by a Let's Encrypt SSL certificate generated within the AzuraCast system settings to ensure secure embed playback without mixed-content blocking[cite: 871, 873, 876].

---

## 3. Station Lineup & Vibe Context
[cite_start]The network consists of three distinct stations running concurrently on the AzuraCast installation[cite: 5, 803]. [cite_start]Files are organized into playlists (e.g., "The Rock Garden - Tributes") and pushed live via the AutoDJ[cite: 821, 822, 823].

| Station Name | Vibe & Genre Format | Target Web Hub |
| :--- | :--- | :--- |
| **The Rock Garden** | [cite_start]All-vinyl classic rock, funk, blues, and jazz[cite: 3]. | [cite_start]`therockgarden.tv` [cite: 4] |
| **The Golden Boombox (GBS)** | [cite_start]Golden era and future classic hip-hop[cite: 4]. | [cite_start]`jacewonmusic.com` [cite: 4, 818] |
| **Bridge City Hang Suite (BCHS)** | [cite_start]Grown folk R&B[cite: 4]. | [cite_start]`jacewonmusic.com` [cite: 4, 818] |

---

## 4. Artist Profile: Jacewon
When writing copy or designing UI for this network, it is crucial to understand the pedigree of the host. [cite_start]Jacewon is not a novice to radio or curation[cite: 55].

* [cite_start]**Musical Pedigree:** A seasoned DJ who has opened for legendary hip-hop acts including KRS-One, De La Soul, and Mos Def[cite: 54]. 
* [cite_start]**Radio Roots:** Gained fundamental broadcast experience running logs for the music librarian at the iconic 92.3 The Beat in LA[cite: 54].
* [cite_start]**Professional Background:** Served as the Creative Director for DreamHost for 7 years, bringing a deep understanding of branding, web design, and digital infrastructure to the table[cite: 541].
* [cite_start]**The Ethos:** Relentless DIY energy, dedicated to building independent broadcast architecture while refusing to compromise on the quality of the mix[cite: 262, 561].