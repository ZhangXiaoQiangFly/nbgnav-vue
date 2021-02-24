<!--任务列表页面  -->
<template>
  <div class="cmd-wrap {'data-bg': instructlist.length === 0}">
    <div class="cmd-list-wrap">
      <ul class="cmd-list">
        <li v-for="(item, key) of instructlist" :key="key">
          <div class="cmd-item">
            <span class="span-layout" style="position: absolute; left: 1rem">{{
              key + 1
            }}</span
            ><label>箱号:</label>
            <div>
              <span class="box-icon f" v-if="item.TwinStatus === '1'">F</span>
              <span class="box-icon b" v-if="item.TwinStatus === '2'">B</span>
              {{ item.ContainerID }}
            </div>
          </div>
          <div class="cmd-item">
            <span class="span-layout"></span><label>From/To:</label>
            <div style="float: left; width: 50%">
              {{ item.GotoStatus }}
              <img
                @click="gotonavi(item)"
                src="../../src/assets/iconfont/goto.svg"
                style="
                  width: 2rem;
                  height: 2rem;
                  position: absolute;
                  right: 2rem;
                "
              />
            </div>
          </div>
          <div class="cmd-item">
            <span class="span-layout"></span><label>位置:</label>
          </div>
          <div class="cmd-item">
            <span class="span-layout"></span><label>备注:</label>
            <div>{{ item.Remarks }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      instructlist: [
        { Remarks: "", GotoStatus: "", ContainerID: "", TwinStatus: "" },
      ],
    };
  },
  methods: {
    getCityInfo() {
      this.instructlist = [{}, {}, {}, {}, {}, {}, {}, {}];
    },
    gotonavi(item) {
      console.log(item);
      this.$router.push("/NavHome");
    },
  },
  mounted() {
    this.getCityInfo();
  },
};
</script>

<style lang="stylus" scoped>
.command {
  text-align: center;
  font-weight: 900;
  width: 100%;
}

.cmd-wrap {
  text-align: center;
  box-sizing: border-box;
  background: #f3f8ff;

  &.data-bg {
    background-size: 40%;
  }

  .cmd-list-wrap {
    overflow: hidden;

    .cmd-list {
      li {
        margin: 0.8rem;
        padding: 0.3rem 0.5rem;
        border-radius: 0.3rem;
        box-shadow: 0 4px 15px #ccc;
        background: #fff;
        overflow: hidden;

        &.on {
          box-shadow: 0 0 12px #3385ff inset;
        }

        .cmd-item {
          height: 2.05rem;
          line-height: 2.05rem;
          font-size: 1.2rem;
          font-weight: bold;
          color: #585858;

          .header-fixed-back {
          }

          span.span-layout {
            width: 4%;
            float: left;
          }

          label {
            width: 32%;
            line-height: 2.05rem;
            padding-right: 1%;
            float: left;
            text-align: right;
          }

          div {
            width: 63%;
            line-height: 2.05rem;
            float: left;
            text-align: left;

            .box-icon {
              display: inline-block;
              vertical-align: middle;
            }

            .box-icon.f {
              &:after {
                content: '';
                display: inline-block;
                width: 0;
                height: 0;
                border-bottom: 0.9rem solid #333;
                border-left: 0.5rem solid transparent;
                border-right: 0.5rem solid transparent;
              }
            }

            .box-icon.b {
              &:after {
                content: '';
                display: inline-block;
                width: 0;
                height: 0;
                border-top: 0.9rem solid #333;
                border-left: 0.5rem solid transparent;
                border-right: 0.5rem solid transparent;
              }
            }
          }
        }
      }
    }
  }
}
</style>
