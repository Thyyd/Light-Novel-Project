function Comments({ commentaires }) {
  {/* Pas de pagination fonctionnelle pour la v0 ; séparation Desktop/Mobile à prévoir plus tard */}
  return(
    <div className="commentaires-desktop flex flex-col gap-4 bg-white rounded-2xl shadow-md p-6 m-6 md:p-8 md:m-12">
      <h2 className="font-title font-bold text-2xl text-black">Commentaires</h2>
      <ul className="commentaires-list flex flex-col">
        {commentaires.data.length === 0 && (
          <li className="font-body text-[#555555] text-sm">Aucun commentaire pour le moment.</li>
        )}
        {commentaires.data.map((commentaire) => (
          <li
            key={commentaire.id}
            className="commentaire flex gap-4 py-4 border-t border-[#EEEEEE] first:border-t-0 first:pt-0"
          >
            <img
              src={commentaire.utilisateur.avatarUrl}
              alt={`Avatar de ${commentaire.utilisateur.pseudo}`}
              className="w-15 h-15 rounded-full object-cover shrink-0"
            />

            <div className="flex flex-col gap-1 font-body">
              <div className="commentaire-header flex items-center gap-2">
                <span className="commentaire-pseudo text-black font-bold">{commentaire.utilisateur.pseudo}</span>
                {/* TODO : nécessite createdAt côté backend (absent du controller actuel) */}
              </div>
              <p className="text-black">{commentaire.contenu}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Comments;
