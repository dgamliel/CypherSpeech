const helpers = {
    makeButton: function (name){
        return `
<div class="padLeft">
    <button class="btn btn-lg btn-primary">${name}</button>
</div>
        `;
    }
}

module.exports = helpers;