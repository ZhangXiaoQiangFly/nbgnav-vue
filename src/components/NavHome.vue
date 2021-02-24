<!--导航页面  -->
<template >
  <div>
    <div class="noload" v-show="!roadGeojsonLoaded">
      <img src="../assets/loading-svg/loading-spokes.svg" alt="" />
      <div style="color: aliceblue; font-size: 1rem">
        导航路线规划中，请稍等
      </div>
    </div>
    <button class="back" @click="back()">返回</button>
    <div id="map"></div>
    <div v-if="roadGeojsonLoaded">
      <div v-html="html" class="guidance"></div>
      <div v-if="confirmearrive">
        <div class="confirmed">确认到达</div>
      </div>
      <div v-else class="start_guidance">
        剩余里程：{{ resmile }} 预计时间：{{ restime }}
      </div>
    </div>
  </div>
</template>


<script>
import * as smartmapx from "@smx/api";
import * as $ from "jquery";
import smartnavx from "../../public/smartnavix";
import axios from "axios";
export default {
  data() {
    return {
      map: "",
      //剩余里程
      resmile: "",
      //预计时间
      restime: "",
      //导航规划完成
      roadGeojsonLoaded: false,
      locationEngine: "",
      html: "",

      goTo: "",
      exitDisable: "",
      backDisable: "",
      timer: "",
      quitStatus: "",
      speakArray: "",
      inSpeaking: "",
      locationEngine: "",
      pathFinder: "",
      navigation: "",

      mapLoaded: "",
      runMarker: "",
      finding: "",
      routeLeg: "",

      fromMarker: "",
      toMarker: "",
      navigationControl: "",
      voicePlayer: "",
      navigationListener: "",
      //确认到达
      confirmearrive: false,
    };
  },
  methods: {
    back() {
      this.startNavigation();
      //this.$router.push("/");
    },
    hello() {
      console.log("hello");
    },
    //第一次规划导航
    firstRouting() {
      setTimeout(() => {
        if (this.pathFinder) {
          this.dragend();
        } else {
          this.firstRouting();
        }
      }, 100);
    },

    dragend() {
      this.routing(this.fromMarker.getLngLat(), this.toMarker.getLngLat());
    },

    routing(fromPoint, toPoint) {
      this.pathFinder.find(
        [fromPoint.lng, fromPoint.lat],
        [toPoint.lng, toPoint.lat],
        (error, route) => {
          if (error) {
            console.log(error.message);
          } else {
            this.routeLeg = route.legs[0];
            this.setNavigationInfo(this.routeLeg);
            console.log(" routeLeg " + this.routeLeg);
          }
        }
      );
    },

    setNavigationInfo(routeLeg) {
      this.map.getSource("routing").setData(routeLeg.geometry);
      this.resmile = this.distanceDesc2(routeLeg.distance);
      this.restime = this.durationDesc(routeLeg.duration);
      let html = "";
      routeLeg.steps.forEach((step) => {
        if (step.maneuver.type === "depart") {
          html +=
            "<tr>向" +
            this.directionDesc(step.maneuver.bearing_after) +
            "出发</td><td>沿" +
            this.getRoadName(step.name) +
            "</td><td>行驶" +
            this.distanceDesc2(step.distance) +
            "</td></tr>";
        }
      });
      this.html = html;
    },
    startNavigation() {
      this.map.setZoom(18);
      if (this.navigation) {
        this.navigation.stop();
      }

      if (this.locationEngine) {
        this.locationEngine.stop();
      }

      if (this.locationEngine.getProvider() === "simulator") {
        this.locationEngine.setRouteLeg(this.routeLeg);
      }

      this.navigation.start(this.routeLeg, this.navigationListener);
      const request = new smartnavx.LocationEngineRequest();
      request.interval = 500;
      this.locationEngine.start(request);

      this.playVoice(
        "开始导航，全程" +
          this.distanceDesc(this.routeLeg.distance) +
          "，大约需要" +
          this.durationDesc(this.routeLeg.duration),
        false
      );
    },

    stopNavigation() {
      if (this.navigation) {
        this.navigation.stop();
        this.voicePlayer.pause();
      }
    },
    playVoice(content, isNow) {
      if (isNow) {
        this.voicePlayer.playVoiceTextNow(content);
      } else {
        this.voicePlayer.addVoiceText(content);
      }
    },
    arriveTurnDesc(turnType) {
      if (turnType === "sharp right") {
        return "右后方";
      } else if (turnType === "right") {
        return "右侧";
      } else if (turnType === "slight right") {
        return "右前方";
      } else if (turnType === "straight") {
        return "前方";
      } else if (turnType === "slight left") {
        return "左前方";
      } else if (turnType === "left") {
        return "左侧";
      } else if (turnType === "sharp left") {
        return "左后方";
      } else if (turnType === "uturn") {
        return "后方";
      }
    },
    directionDesc(angle) {
      if (angle > 120 && angle < 180) return "西南";
      if (angle > 40 && angle <= 120) return "西";
      if (angle > 20 && angle <= 40) return "西北";
      if ((angle >= 0 && angle <= 20) || (angle >= 340 && angle <= 360))
        return "北";
      if (angle > 320 && angle < 340) return "东北";
      if (angle > 240 && angle <= 320) return "东";
      if (angle > 180 && angle <= 240) return "东南";
      return "南";
    },

    distanceDesc2(length) {
      length = Math.round(length);
      return length < 1000
        ? length + "米"
        : this.fixNumber(length / 1000, 1) + "公里";
    },
    distanceDesc(length) {
      if (length <= 15) return "马上";
      else if (length <= 150) return Math.round(length / 10) * 10 + "米";
      else if (length <= 250) return "200米";
      else if (length <= 350) return "300米";
      else if (length <= 450) return "400米";
      else if (length <= 550) return "500米";
      else if (length <= 650) return "600米";
      else if (length <= 750) return "700米";
      else if (length <= 850) return "800米";
      else if (length <= 950) return "900米";
      else if (length <= 1050) return "1公里";
      else {
        return this.fixNumber(length / 1000, 1) + "公里";
      }
    },
    turnToIcon(turnType) {
      return "icon-" + String(turnType).replace(" ", "-");
    },

    turnDesc(turnType) {
      if (turnType === "sharp right") {
        return "右后方转弯";
      } else if (turnType === "right") {
        return "右转";
      } else if (turnType === "slight right") {
        return "右前方转弯";
      } else if (turnType === "straight") {
        return "直行";
      } else if (turnType === "slight left") {
        return "左前方转弯";
      } else if (turnType === "left") {
        return "左转";
      } else if (turnType === "sharp left") {
        return "左后方转弯";
      } else if (turnType === "uturn") {
        return "调头";
      }
    },
    fixNumber(value, length) {
      let result = value.toFixed(length);
      while (result.charAt(result.length - 1) === "0") {
        result = result.substring(0, result.length - 1);
      }
      return result.charAt(result.length - 1) === "."
        ? result.substring(0, result.length - 1)
        : result;
    },
    durationDesc(duration) {
      if (duration <= 65) return "1分钟";

      const durationMin = duration / 60;
      if (durationMin < 60) return Math.round(durationMin) + "分钟";

      const durationHours = durationMin / 60;
      return this.fixNumber(durationHours, 1) + "小时";
    },

    getRoadName(name) {
      return name || "无名道路";
    },

    driveRoadPretText(step) {
      return step.maneuver.type === "continue" ? "继续沿" : "驶入";
    },
  },

  mounted() {
    this.navigationListener = {
      startNavigation: (event) => {
        console.log("startNavigation", event);
        // 添加运行marker
        if (this.runMarker) {
          this.runMarker.remove();
        }

        var el = document.createElement("div");
        el.className = "marker";
        el.style.backgroundImage = "url(arrow.png)";
        el.style.backgroundSize = "20px 20px";
        el.style.width = "20px";
        el.style.height = "20px";
        this.runMarker = new smartmapx.Marker(el)
          .setLngLat(event.target.geometry.geometry.coordinates[0])
          .addTo(this.map);
      },

      locationUpdate: (event) => {
        // 更新地图上的点

        this.resmile = this.distanceDesc2(event.toDestinationDistance);
        this.restime = this.durationDesc(event.toDestinationTime);
        console.log(
          `剩余里程:${this.distanceDesc2(
            event.toDestinationDistance
          )}; 剩余时间:${this.durationDesc(event.toDestinationTime)}`
        );

        const location = event.location;
        const track = event.track;
        if (track) {
          this.map.getSource("track").setData(track);
        }
        const lngLat = [location.longitude, location.latitude];
        const heading = location.heading ? location.heading : 0;
        this.runMarker.setLngLat(lngLat);
        this.runMarker.setRotate(heading);
        this.map.easeTo({
          center: lngLat,
          bearing: heading,
          pitch: 30,
          offset: [0, 100],
        });
        // map.setBearing(location.heading);
        // map.setCenter(lngLat);
      },
      showTurn: (event) => {
        // 更新导航引导信息
        const step = event.target.step;
        let html;
        if (step.maneuver.type === "arrive") {
          const modifier = "straight";
          html =
            '<div><span class="' +
            this.turnToIcon(modifier) +
            '"></span>' +
            this.distanceDesc2(event.distance) +
            "抵达</div><div>目的地</div>";
        } else {
          html =
            '<div><span class="' +
            this.turnToIcon(step.maneuver.modifier) +
            '"></span>' +
            this.driveRoadPretText(step) +
            this.getRoadName(step.name) +
            "行驶" +
            this.distanceDesc2(event.distance)+"</div>";
         
        }
        this.html = html;
        console.log(html);
      },

      voiceTurn: (event) => {
        const voiceTurnGuidanceArray = event.target;
        const firstVoiceTurnGuidance = voiceTurnGuidanceArray[0];
        let content = "";
        if (firstVoiceTurnGuidance.step.maneuver.type === "depart") {
          content =
            "向" +
            this.directionDesc(firstVoiceTurnGuidance.step.maneuver.modifier) +
            "出发，行驶" +
            this.distanceDesc(firstVoiceTurnGuidance.nextStep);
        } else if (
          firstVoiceTurnGuidance.toTurnDistance <= 100 &&
          firstVoiceTurnGuidance.step.maneuver.type === "arrive"
        ) {
          // 即将抵达有专门事件，不播报
          return;
        } else {
          // 大于400米播报继续行驶
          if (firstVoiceTurnGuidance.toTurnDistance > 400) {
            content = "请";
            if (firstVoiceTurnGuidance.currentStep.name) {
              content += "沿" + firstVoiceTurnGuidance.currentStep.name;
            }
            content +=
              "继续行驶" +
              this.distanceDesc(firstVoiceTurnGuidance.toTurnDistance);
          } else {
            // 否则播报转弯
            content =
              "前方" + this.distanceDesc(firstVoiceTurnGuidance.toTurnDistance);
            if (firstVoiceTurnGuidance.step.maneuver.type !== "arrive") {
              content += this.turnDesc(
                firstVoiceTurnGuidance.step.maneuver.modifier
              );
              if (firstVoiceTurnGuidance.step.name)
                content +=
                  "，" +
                  this.driveRoadPretText(firstVoiceTurnGuidance.step) +
                  firstVoiceTurnGuidance.step.name;
            }
          }
        }

        // 连续事件
        for (let i = 1; i < voiceTurnGuidanceArray.length; i++) {
          const voiceTurnGuidance = voiceTurnGuidanceArray[i];
          content +=
            "，随后" + this.turnDesc(voiceTurnGuidance.step.maneuver.modifier);
          if (voiceTurnGuidance.step.name)
            content +=
              "，" +
              this.driveRoadPretText(voiceTurnGuidance.step) +
              voiceTurnGuidance.step.name;
        }

        // 抵达事件
        if (
          firstVoiceTurnGuidance.toTurnDistance > 100 &&
          firstVoiceTurnGuidance.step.maneuver.type === "arrive"
        ) {
          content += "抵达目的地";
        }
        this.playVoice(content, true);
        console.log("voiceTurn", content, event);
      },

      overSpeed: (event) => {
        const content =
          "您已超速，车速" +
          event.drivingSpeed +
          "，当前路段限速" +
          event.limitSpeed;
        console.log(content);
        this.playVoice(content, false);
      },

      willEnterLastRoad: (event) => {
        console.log("willEnterLastRoad", event);
        const step = event.target.step;
        const name = step.name ? "目的地入口" : step.name + "入口";
        this.playVoice(
          "前方" + this.distanceDesc2(event.distance) + "进入" + name,
          false
        );
      },

      endNavigation: (event) => {
        this.playVoice("您已到达目的地，本次导航结束", false);
        //this.navigationControl.setHTML("<div>您已到达目的地，本次导航结束</div>");
        this.html = "<div>您已到达目的地，本次导航结束</div>";
        this.confirmearrive = true;
        console.log("endNavigation", event);
      },

      willEndNavigation: (event) => {
        console.log("即将抵达目的地！");
        this.playVoice("即将抵达目的地！", false);
      },
    };
    smartmapx.mapbase = "https://zgnav.npedi.com/";
    smartmapx.apikey =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYmYiOjE1MzcxODM1OTgsImRhdGEiOiJ7XCJsb2dpbl9uYW1lXCI6XCJyb290XCIsXCJnZW5kZXJcIjoyLFwidXNlcl9pZFwiOlwiZm1fc3lzdGVtX3VzZXJfcm9vdFwiLFwidXNlcl9uYW1lXCI6XCJyb290XCIsXCJ1c2VyX29yaWdpbl9pZFwiOlwiZm1fbG9jYWxcIixcInByb2R1Y3RfaWRcIjpcIlwiLFwiZXhwaXJlX3RpbWVcIjpcIlwiLFwic291cmNlX2lkXCI6XCJcIixcInR5cGVcIjpcIlwiLFwiY29ycF9pZFwiOlwiZm1fc3lzdGVtX2NvcnBcIn0iLCJleHAiOjQwOTI1OTkzNDksImp0aSI6ImFfNjhmZjBhZGY5OTcxNDQ0NThjNzViZWFiN2FjNTkzYWYifQ.W122WkT6QR4HZWbpalkpmirV9JWkDYcCkmNZoxCB_z8";
    this.map = new smartmapx.Map({
      container: "map",
      center: [122, 29.77462],
      zoom: 15,
      mapId: "de28d838-2e47-4474-a912-02211c09224f",
      /*  mapId: "map_id_1", */
    });
    // 初始化路径计算服务
    this.locationEngine = new smartnavx.SimulateLocationEngine(null, 100);
    this.voicePlayer = new smartnavx.HtmlVoicePlayer();
    this.map.on("load", () => {
      this.mapLoaded = true;
      /*  var el = document.createElement("div");
      el.className = "marker";
      el.style.backgroundImage = "url(arrow.png)";
      el.style.backgroundSize = "20px 20px";
      el.style.width = "20px";
      el.style.height = "20px";
      this.runMarker = new smartmapx.Marker(el)
        .setLngLat([122.002555, 29.767972])
        .addTo(this.map); */

      var roadGeoJSONUrl = "road.geojson";

      $.getJSON(roadGeoJSONUrl, (data) => {
        this.pathFinder = new smartnavx.PathFinder({
          roadGeojson: data,
        });

        this.pathFinder.on("load", () => {
          console.log("success to load road geojson");
          this.roadGeojsonLoaded = true;
          if (this.roadGeojsonLoaded && this.mapLoaded) {
            this.firstRouting();
          }
        });
        this.pathFinder.on("error", (error) => {
          console.log(error);
        });
        this.navigation = new smartnavx.Navigation(
          this.pathFinder,
          this.locationEngine,
          {
            overspeedRoad: false,
            overspeedCheckInterval: 1000,
            overspeedContinuedCount: 3,
          }
        );

        this.navigation.hasWillEnterLastRoad = true;
        this.navigation.willEnterLastRoadDistance = 50;
      });

      this.map.addSource("road", {
        type: "geojson",
        data: roadGeoJSONUrl,
      });
      this.map.addLayer({
        id: "road",
        type: "line",
        source: "road",
        paint: {
          "line-color": "blue",
          "line-opacity": 0.8,
          "line-width": 0.5,
        },
      });
      this.map.addSource("routing", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      this.map.addSource("track", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      this.map.addLayer({
        id: "汽车导航_o",
        type: "line",
        source: "routing",
        layout: {
          visibility: "visible",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "rgba(14, 86, 38, 1)",
          "line-width": 9,
          "line-opacity": 1,
        },
      });
      this.map.addLayer({
        id: "汽车导航",
        type: "line",
        source: "routing",
        layout: {
          visibility: "visible",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "rgba(26, 184, 87, 1)",
          "line-width": 7,
          "line-opacity": 0.8,
        },
      });
      this.map.addLayer({
        id: "汽车导航_icon",
        type: "line",
        source: "routing",
        layout: {
          visibility: "visible",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "rgba(26, 184, 87, 1)",
          "line-width": 7,
          "line-opacity": 0.8,
          "line-pattern": "0000009",
        },
      });

      // 车辆形式轨迹
      this.map.addLayer({
        id: "行驶后_o",
        type: "line",
        source: "track",
        paint: {
          "line-color": "rgba(117, 129, 146, 1)",
          "line-width": 10,
          "line-opacity": 1,
        },
      });
      this.map.addLayer({
        id: "行驶后",
        type: "line",
        source: "track",
        paint: {
          "line-color": "rgba(184, 198, 211, 1)",
          "line-width": 8,
          "line-blur": 2,
        },
      });
      this.map.addLayer({
        id: "行驶后_icon",
        type: "line",
        source: "track",
        paint: {
          "line-color": "rgba(156, 171, 192, 1)",
          "line-width": 8,
          "line-blur": 2,
          "line-pattern": "0000009",
        },
      });

      this.fromMarker = new smartmapx.UnionMarker([122.002555, 29.767972]);
      /*  this.fromMarker.addTo(this.map);
      this.fromMarker.setLabel(
        new smartmapx.Label(" 起点 ", {
          offset: [25, -5],
        })
      ); */
      this.fromMarker.enableDragging();
      this.fromMarker.on("dragend", this.dragend);

      this.toMarker = new smartmapx.UnionMarker([122.004975, 29.77044]);
      /*  this.toMarker.addTo(this.map);
      this.toMarker.setLabel(
        new smartmapx.Label(" 终点 ", {
          offset: [25, -5],
        })
      ); */
      this.toMarker.enableDragging();
      this.toMarker.on("dragend", this.dragend);
    });
  },
  created() {},
};
</script>

<style  scoped>
#map {
  position: absolute;
  top: -1.5rem;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.back {
  position: absolute;
  z-index: 99;
  left: 1rem;
  top: 1rem;
  width: 3rem;
  height: 1.5rem;
  font-size: 0.8rem;
  background: #0066ff;
  border-radius: 0.4rem;
  color: lemonchiffon;
}
.noload {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(164, 165, 219, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 99;
}
.guidance {
  font-size: 1.2rem;
  color: lemonchiffon;
  width: 90%;
  left: 5%;
  position: absolute;
  top: 15%;
  border-radius: 0.4rem;
  background: #0066ff;
  height: 7%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirmed {
  font-size: 1.2rem;
  color: lemonchiffon;
  width: 100%;
  position: absolute;
  bottom: 0;
  border-radius: 0.4rem;
  background: #0066ff;
  height: 7%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.start_guidance {
  font-size: 1.2rem;
  color: rgb(43, 42, 33);
  width: 100%;
  position: absolute;
  bottom: 0;
  border-radius: 0.4rem;
  background: #ffffff;
  height: 7%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
