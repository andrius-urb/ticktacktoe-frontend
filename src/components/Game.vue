<template>
  <div>
    <div class="grid">
      <div class="row" v-for="x in 3" :key="x">
        <div
          class="cell"
          v-for="n in 3"
          :key="n"
          @click="doClick(x - 1, n - 1)"
        >{{ isItZeroOrCross(items[x-1][n-1]) }}</div>
        <!---->
      </div>
    </div>
    <div v-if="this.gameEnd == true">
      <div v-if="this.winner !== null">{{ (this.winner) ? 'Laimėjo O' : 'Laimėjo X' }}</div>
      <div v-else>Lygiosios!</div>
    </div>
    <br />
    <div>
      <button @click="restart()">Pradėti iš naujo</button>
      <button @click="testApi()">Test API</button>
    </div>
    <br />
    <div class="container">
      <div
        class="row"
        v-for="action in this.actions.slice().reverse()"
        :key="action[2]+'-'+action[0]+'-'+action[1]"
      >{{ (action[2]) ? 'Žaidėjas O' : 'Žaidėjas X' }} padarė veiksmą laukelyje {{ action[0] }}, {{ action[1] }}</div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
export default {
  name: "Game",
  data() {
    return {
      /**
       * items: kiekvienas masyvo laukelis atspindi žaidimo lentelės laukelį
        |0,0|0,1|0,2|
        |1,0|1,1|1,2| 
        |2,0|2,1|2,2|
        
        * null - laukelis laisvas
        * false - laukelyje X(iksiukas)
        * true  - laukelyje O(nuliukas)
    
       */
      items: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      playerTurn: false, // false - X eilė. true - O eilė
      winner: null, // laimėtojas. false - X, true - O, null - nėra laimėtojo.
      gameEnd: false, // true, jei žaidimas baigtas.
      actions: [],
    };
  },
  watch: {
    items: {
      handler() {
        // tikriname ar kažkuris žaidėjas laimėjo
        //var isX = false;
        //var isO = true;
        var isX = false;
        var isO = true;
        var checkPlayer = isX;
        var result = true;

        /**
         * Tikriname įstrižai 0,0  1,1  2,2 laukelius
         */
        for (var b = 0; b < 2; b++) {
          // Šis ciklas pirmą kartą tikrina X žaidėja, antrą kartą O žaidėją.
          result = true;
          if (b == 1) checkPlayer = isO; // ciklas veikia antrą kartą, kuomet tikriname O žaidėją. Priskiriam kintamąjį checkPlayer į isO(true).
          for (var a = 0; a < 3; a++) {
            /**
             * Kadangi kintamasis result = true, tai tikrinant turi būti:
             * result = true && true, tam kad gautume rezultatą jog yra laimėtojas(nes true && true yra TRUE)
             * jeigu sąlyga kitokia, pvž:
             * result = true && false, laimėtojo nėra(nes true && false yra FALSE)
             */
            result = result && this.items[a][a] == checkPlayer;
          }

          if (result) {
            /**
             * result = true, reiškia yra laimėtojas.
             * Laimėtojas bus tas, kurį paskutinį tikrino ciklas. Jį nurodo kintamasis checkPlayer.
             * Perduodame laimėtoją funkcijai.
             */
            return this.gameOver(checkPlayer);
          }
        }

        /**
         * Tikriname įstrižai 2,0  1,1  0,2 laukelius
         */
        checkPlayer = isX;
        for (b = 0; b < 2; b++) {
          result = true;
          if (b == 1) checkPlayer = isO;
          for (a = 0; a < 3; a++) {
            result = result && this.items[2 - a][a] == checkPlayer;
          }
          if (result) {
            return this.gameOver(checkPlayer);
          }
        }

        checkPlayer = isX;
        for (b = 0; b < 2; b++) {
          if (b == 1) checkPlayer = isO;
          for (a = 0; a < 3; a++) {
            result = true;
            for (var c = 0; c < 3; c++) {
              /**
               * Tikrinam linijas
               */
              result = result && this.items[a][c] == checkPlayer;
            }
            if (result) {
              return this.gameOver(checkPlayer);
            }
            result = true;
            for (c = 0; c < 3; c++) {
              /**
               * Tikrinam stulpelius
               */
              result = result && this.items[c][a] == checkPlayer;
            }
            if (result) {
              return this.gameOver(checkPlayer);
            }
          }
        }

        /** Nei viena sąlyga nepatenkinta, reiškia dar nėra laimėtojo,
         * tikriname ar neužimta visi laukeliai
         */
        var count = 0;
        for (a = 0; a < 3; a++) {
          count = count + this.items[a].filter((item) => item === null).length;
        }
        if (count == 0) {
          return this.gameOver(null);
        }
      },
      deep: true,
    },
  },
  methods: {
    doClick(x, n) {
      //console.log("clicked " + x + " and " + n);
      if (this.gameEnd) {
        return alert("Žaidimas baigtas!");
      }
      if (this.items[x][n] !== null) {
        return alert("Laukelis užimtas!");
      }
      this.actions.push([x, n, this.playerTurn]);
      //console.table(this.actions);
      Vue.set(this.items[x], n, this.playerTurn);
      //this.items[x][n] = this.playerTurn;
      this.playerTurn = !this.playerTurn;
      //console.table(this.items);
    },
    isItZeroOrCross(value) {
      if (value === null) {
        return "";
      } else {
        if (value) {
          return "O";
        }
        return "X";
      }
    },
    gameOver(winnerPlayer) {
      this.winner = winnerPlayer;
      this.gameEnd = true;
    },
    restart() {
      // Atstatom kintamuosius į pradinę padėtį.
      this.playerTurn = false;
      this.winner = null;
      this.gameEnd = false;
      for (var a = 0; a < 3; a++) {
        this.items[a].fill(null);
      }
      this.actions = [];
    },
    testApi() {
      this.$api
        .get("test")
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
  mounted() {},
};
</script>

<style>
.grid {
  display: table;
  border-spacing: 0.5px;
  align-items: center;
  justify-content: center;
}
.row {
  display: table-row;
}
.cell {
  width: 50px;
  height: 50px;
  background: white;
  display: table-cell;
  border-color: black;
  border-width: 2px;
  border-style: solid;
  font-size: 45px;
  text-align: center;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 10px;
}

.row {
  width: 75%;
  height: 100%;
  background: white;
  border-color: black;
  border-width: 1px;
  border-style: solid;
}
</style>