<template>
  <div>
    <div class="grid">
      <div class="row" v-for="x in 3" :key="x">
        <div
          class="cell"
          v-for="n in 3"
          :key="n"
          @click="doClick(x - 1, n - 1)"
        >{{ items[x-1][n-1] }}</div>
        <!---->
      </div>
    </div>
    <div v-if="this.gameEnd == true">
      <div v-if="this.winner !== ' '">{{ 'Laimėjo '+ this.winner }}</div>
      <div v-else>Lygiosios!</div>
    </div>
    <br />
    <div>
      <button @click="restart()">Pradėti iš naujo</button>
    </div>
    <br />
    <div class="container">
      <div
        class="row"
        v-for="action in this.actions.slice().reverse()"
        :key="action[2]+'-'+action[0]+'-'+action[1]"
      >{{ 'Žaidėjas '+action[2]+' ' }} padarė veiksmą laukelyje {{ action[0] }}, {{ action[1] }}</div>
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
        
        * " " - laukelis laisvas
        * "X" - laukelyje X(iksiukas)
        * "O"  - laukelyje O(nuliukas)
    
       */
      items: [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
      ],
      playerTurn: "X", // kurio žaidėjo eilė.
      winner: null, // Nurodomas laimėtojas. "X" arba "O", jeigu yra " ", reiškia lygiosios
      gameEnd: false, // true, jei žaidimas baigtas. Tik esant šio kintamojo TRUE reikšmei, žiūrima kintamasis "winner"

      /**
       * TRUE, jei galima atlikti veiksmus.
       * FALSE, jei negalima.
       * Paleidžiant puslapį kreipiamasi į backend, siekiant rasti buvusius veiksmus ir užpildyti lentelę,
       * jeigu tokių veiksmų buvo rasta. Kol duomenys negauti, šis kintamasi yra FALSE ir neleidžia atlikti jokio
       * veiksmo lentelėje.
       *
       * Taip pat kai atliekamas veiksmas, kol negautas atsakymas iš backend, neleidžia nieko daryti.
       */
      canDoMoves: false,
      actions: [],
    };
  },
  beforeMount() {
    this.fillBoardFromDatabase();
  },
  methods: {
    /**
     * Funkcija duomenų įkėlimui iš duomenų bazės.
     */
    fillBoardFromDatabase() {
      /**
       * Prieš paleidžiant puslapį, kreipiamės į backend ir ieškome, ar buvo prieš tai atlikta veiksmų.
       * Jeigu veiksmų yra, reiškia žaidimas yra prasidėjęs ir laimėtojas yra arba ne, tačiau žaidimas nebuvo paleistas iš naujo,
       * todėl žaidimas tęsiamas.
       */
      var vm = this;
      this.$api
        .get("actions")
        .then((res) => {
          res.data.forEach(function (tblrow) {
            /**
             * Gautus duomenis iš duomenų bazės priskiriam "actions" kintamajam, kur registruojami atlikti veiksmai.
             * Taip pat, pagal gautus duomenis sudeliojame "items" masyvą, kur registruojama, kuris žaidėjas, kuriame laukelyje
             * atliko veiksmą.
             * Pabaigoje priskiriame playerTurn kintamąjį priešingai reikšmei, negu duomenų bazėje nurodyta, nes jeigu paskutinį veiksmą atliko
             * X žaidėjas, tuomet dabar eilė O žaidėjui. */

            vm.actions.push([tblrow.row, tblrow.column, tblrow.player]);
            Vue.set(vm.items[tblrow.row], tblrow.column, tblrow.player);
            vm.playerTurn = tblrow.player === "X" ? "O" : "X";
          });
        })
        .catch((err) => {
          console.log(err);
        });

      this.$api
        .get("check")
        .then((res) => {
          if (res.data.winner) {
            //vm.winner = res.data.winner;
            //vm.gameEnd = true;
            this.gameOver(res.data.winner);
          }
          vm.canDoMoves = true; // Nurodome, kad galima atlikti veiksmus lentelėje.
        })
        .catch((err) => {
          console.log(err);
        });
    },
    /***
     * Funkcija, kuri vykdoma paspaudus ant bet kurio laukelio
     * Parametrai:
     *  x:  Eilutė
     *  n:  Stulpelis
     */
    doClick(x, n) {
      if (!this.canDoMoves) {
        // Jeigu praeito žaidimo duomenys nesukelti, jeigu tokių buvo, neleisti jokio veiksmo.
        return;
      }

      if (this.gameEnd) {
        // Jeigu žaidimas pasibaigęs, pranešame.
        return alert("Žaidimas baigtas!");
      }
      if (this.items[x][n] !== " ") {
        // Jeigu paspaustas laukelis nėra " ", t.y. jau užimtas, pranešame.
        return alert("Laukelis užimtas!");
      }
      this.canDoMoves = false;
      // Į "actions" kintamąjį perduodame atliktą veiksmą, kuris žaidėjas, ant kurio laukelio paspaudė.
      this.actions.push([x, n, this.playerTurn]);

      // Pakeičiame masyvo "items" atitinkamoje vietoje reikšmę į X arba O, priklausomai, kurio žaidėjo eilė (this.playerTurn)
      Vue.set(this.items[x], n, this.playerTurn);

      // Siunčiame duomenis į backend, kad įrašytų veiksmą į duomenų bazę
      var vm = this;
      this.$api
        .post("action", {
          player: this.playerTurn,
          row: x,
          col: n,
        })
        .then((res) => {
          if (res.data.winner) {
            // Jeigu yra laimėtojas arba lygiosios, nurodom, kad žaidimas baigtas.
            this.gameOver(res.data.winner);
          }
        })
        .catch(function (error) {
          vm.actions.pop();
          Vue.set(vm.items[x], n, " ");
          vm.fillBoardFromDatabase();
          console.log(error);
        })
        .then(function () {
          vm.canDoMoves = true; // Nurodom, kad galima daryti veiksmus su lentele, net jei ir žaidimas baigtas, nes žaidimo pabaigos atveju, nieko daryti neleidžia "gameEnd = true"
        });

      //  Pakeičiame "playerTurn" kintamąjį į priešingą buvusiam, taip nurodydami, kad dabar kito žaidėjo eilė.
      this.playerTurn = this.playerTurn === "X" ? "O" : "X";
    },

    /**
     * Funkcija sustabdanti žaidimą esant laimėtojui arba lygiosioms.
     * Parametrai:
     *  winnerPlayer: Kuris žaidėjas laimėjo
     * Galimi variantai:
     *  true:   Jei laimėjo O
     *  false:  Jei laimėjo X
     *  null:   Jei lygiosios
     */
    gameOver(winnerPlayer) {
      this.winner = winnerPlayer;
      this.gameEnd = true;
    },

    /**
     * Funkcija paleidžianti žaidimą iš naujo.
     */
    restart() {
      // Atstatom kintamuosius į pradinę padėtį.
      this.playerTurn = "X";
      this.winner = " ";
      this.gameEnd = false;
      for (var a = 0; a < 3; a++) {
        this.items[a].fill(" ");
      }
      this.actions = [];

      // Kreipiamės į backend ir ištrinam esančius duomenis apie žaidėjų veiksmus.
      this.$api
        .post("actions", {
          _method: "delete",
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
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